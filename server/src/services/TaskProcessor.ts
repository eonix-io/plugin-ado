import { deepEquals, EonixClient, InputType, IScalarValue, ISchema, isScalarValue, ITask, ITaskInput, putTasksMutation, taskToTaskInput, uuid, UUID, ValueType } from '@eonix-io/client';
import { WorkItem } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';
import { ITaskAppData } from '../IAppData';
import { IInputMapping } from '../IInputMapping';
import { ITaskMapping } from '../ITaskMapping';
import { fetch } from 'cross-fetch';
import { createHash } from 'crypto';

export class TaskProcessor {

   private _mappedTasks: ITaskMapping<ITaskAppData>;
   private _mappedInputs: IInputMapping;

   public constructor(
      private readonly _eonixClient: EonixClient,
      private readonly _boardId: UUID,
      private readonly _adoToken: string,
      readonly schema: ISchema,
      readonly existingTasks: ITask<ITaskAppData>[]
   ) {

      this._mappedTasks = Object.fromEntries(existingTasks.filter(t => t.appData?.pluginAdo?.workItemId).map(t => [t.appData!.pluginAdo!.workItemId, t]));

      this._mappedInputs = Object.fromEntries(schema.inputs.filter(i => i.appData?.pluginAdo?.referenceName).map(i => {
         return [i.appData!.pluginAdo!.referenceName, i];
      }));
   }

   private readonly _workItemQueue: WorkItem[] = [];

   public QueueWorkItems(workItems: WorkItem[]): void {
      this._workItemQueue.push(...workItems);
      this.processWorkItemQueue();
   }

   private _taskUpdateQueue: ITaskInput[] = [];
   private _workItemProcessingProm: Promise<void> | null = null;
   private processWorkItemQueue(): Promise<void> {

      this._workItemProcessingProm = this._workItemProcessingProm ?? new Promise<void>(r => {

         (async () => {

            while (this._workItemQueue.length) {
               const batch = this._workItemQueue.splice(0, 3);

               const updates = await Promise.all(batch.map(async wi => {
                  try {
                     return await this.getWorkItemTaskUpdate(wi);
                  } catch (e) {
                     console.error(`Error getting task update for work item ${wi.id} - ${e}`);
                     return null;
                  }
               }));

               this._taskUpdateQueue.push(...updates.filter(u => u) as ITaskInput[]);
               this.processTaskUpdateQueue();
            }

            r();
            this._workItemProcessingProm = null;

         })();

      });

      return this._workItemProcessingProm;

   }

   private _tasksUpdated = 0;
   private _taskUpdateProcessingProp: Promise<void> | null = null;
   private processTaskUpdateQueue(flush: boolean = false): Promise<void> {
      if (this._taskUpdateProcessingProp) { return this._taskUpdateProcessingProp; }
      if (!flush && this._taskUpdateQueue.length < 20) { return Promise.resolve(); }

      this._taskUpdateProcessingProp = new Promise<void>(r => {

         (async () => {

            while (this._taskUpdateQueue.length && (flush || this._taskUpdateQueue.length >= 20)) {
               const batch = this._taskUpdateQueue.splice(0, 20);
               console.log(`Writing batch of ${batch.length} tasks. ${this._taskUpdateQueue.length} remaining`);
               await putTasksMutation(this._eonixClient, batch);
               this._tasksUpdated += batch.length;
            }

            r();
            this._taskUpdateProcessingProp = null;
         })();

      });

      return this._taskUpdateProcessingProp;
   }

   public async flushQueue(): Promise<number> {
      await this.processWorkItemQueue();
      //We do this in a loop because if the queue is currently processing, it will be so with flush=false. Therefor it's possible we need to let that one finish then call it again
      while (this._taskUpdateQueue.length) {
         await this.processTaskUpdateQueue(true);
      }

      return this._tasksUpdated;
   }

   private async getWorkItemTaskUpdate(workItem: WorkItem): Promise<ITaskInput | null> {
      if (!workItem.id || !workItem.fields) { return null; }

      const existingTask = this._mappedTasks[workItem.id!];

      const newTask: ITaskInput<ITaskAppData> = {
         id: existingTask?.id ?? uuid(),
         boardId: this._boardId,
         sort: null,
         taskSchema: null,
         fileValues: [],
         listValues: [],
         scalarValues: [],
         taskReferenceValues: [],
         appData: {
            ...existingTask?.appData ?? {},
            pluginAdo: {
               workItemId: workItem.id,
               valueHash: {}
            }
         }
      };

      for (const referenceName of Object.getOwnPropertyNames(this._mappedInputs)) {
         let value: string = workItem.fields[referenceName]?.toString();
         if (!value) { continue; }

         const valueHash = createHash('md5').update(value).digest('hex');
         newTask.appData!.pluginAdo!.valueHash[referenceName] = valueHash;

         const input = this._mappedInputs[referenceName];

         const existingTaskValue = existingTask?.values.find(v => v.inputId === input.id);

         if (
            existingTaskValue
            && valueHash === existingTask.appData?.pluginAdo?.valueHash[referenceName]
            && isScalarValue(existingTaskValue)
            && existingTaskValue.value.value
         ) {
            value = existingTaskValue.value.value;
         } else {

            const azImgMatches = [...value.matchAll(/<img src="(https:\/\/dev.azure.com\/.+?)\?fileName=(.+?)"/gi)];
            if (azImgMatches.length) { console.debug(`Uploading ${azImgMatches.length} images for work item ${workItem.id} - ${referenceName}`); }
            const uploadProms = azImgMatches.map(async m => {
               const fileName = m[2];
               const adoImgUrl = `${m[1]}?fileName=${fileName}`;

               const authHeader = 'Basic ' + Buffer.from(`:${this._adoToken}`).toString('base64');

               const img = await fetch(adoImgUrl, { headers: { 'Authorization': authHeader } }).then(r => r.arrayBuffer());

               const eoImgUrl = await this._eonixClient.uploadMarkdownFile(newTask.id, input.id, fileName, Buffer.from(img));

               value = value.replace(adoImgUrl, eoImgUrl);

            });

            await Promise.all(uploadProms);

            if (azImgMatches.length) { console.debug(`Image upload for work item ${workItem.id} - ${referenceName} complete`); }

         }

         switch (input.type) {
            case InputType.Select:
            case InputType.Text: {
               const scalarValue: IScalarValue = {
                  id: existingTaskValue?.id ?? uuid(),
                  inputId: input.id,
                  type: ValueType.Scalar,
                  appData: null,
                  value: {
                     type: 'string',
                     value
                  }
               };
               newTask.scalarValues?.push(scalarValue);
            }
         }

      }

      if (existingTask) {
         const existingTaskInput = taskToTaskInput(existingTask);
         const isEqual = deepEquals(existingTaskInput, newTask);
         if (isEqual) { return null; }
      }

      return newTask;
   }

}