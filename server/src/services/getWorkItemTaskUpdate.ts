
import { deepEquals, EonixClient, InputType, IScalarValue, ITaskInput, taskToTaskInput, UUID, uuid, ValueType } from '@eonix-io/client';
import { WorkItem } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';
import { ITaskAppData } from '../IAppData';
import { IInputMapping } from '../IInputMapping';
import { ITaskMapping } from '../ITaskMapping';

/** Creates/Updates a board task from a ADO work item. Returns null if no change is needed */
export async function getWorkItemTaskUpdate(adoToken: string, eonixClient: EonixClient, boardId: UUID, inputMapping: IInputMapping, tasks: ITaskMapping, workItem: WorkItem): Promise<ITaskInput | null> {
   if (!workItem.id || !workItem.fields) { return null; }

   const existingTask = tasks[workItem.id!];

   const newTask: ITaskInput<ITaskAppData> = {
      id: existingTask?.id ?? uuid(),
      boardId,
      sort: null,
      taskSchema: null,
      fileValues: [],
      listValues: [],
      scalarValues: [],
      taskReferenceValues: [],
      appData: {
         pluginAdo: {
            workItemId: workItem.id
         }
      }
   };

   for (const referenceName of Object.getOwnPropertyNames(inputMapping)) {
      let value = workItem.fields[referenceName];
      if (!value) { continue; }

      const input = inputMapping[referenceName];

      const azImgMatches = value.matchAll(/<img src="(https:\/\/dev.azure.com\/.+?)\?fileName=(.+?)"/gi);

      for (const m of azImgMatches) {
         const fileName = m[2];
         const adoImgUrl = `${m[1]}?fileName=${fileName}`;

         //$log(fieldValue);
         //$log(`Getting ado img ${adoImgUrl}`);

         try {
            const authHeader = 'Basic ' + Buffer.from(`:${adoToken}`).toString('base64');

            const img = await fetch(adoImgUrl, { headers: { 'Authorization': authHeader } }).then(r => r.arrayBuffer());

            const eoImgUrl = await eonixClient.uploadMarkdownFile(newTask.id, input.id, fileName, Buffer.from(img));

            value = value.replace(adoImgUrl, eoImgUrl);
         } catch (e) {
            console.error('Error downloading ado image', e);
         }
      }

      const existingTaskValue = existingTask?.values.find(v => v.inputId === input.id);

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