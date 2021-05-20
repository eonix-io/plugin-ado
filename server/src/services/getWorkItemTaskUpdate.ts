import { InputType, IScalarValue, ITaskInput, UUID, uuid, ValueType } from '@eonix-io/client';
import { WorkItem } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';
import { ITaskAppData } from '../IAppData';
import { IInputMapping } from '../IInputMapping';
import { ITaskMapping } from '../ITaskMapping';

/** Creates/Updates a board task from a ADO work item. Returns null if no change is needed */
export function getWorkItemTaskUpdate(boardId: UUID, inputMapping: IInputMapping, tasks: ITaskMapping, workItem: WorkItem): ITaskInput | null {
   if (!workItem.id || !workItem.fields) { return null; }

   const existingTask = tasks[workItem.id!];
   if (existingTask) { return null; }
   const newTask: ITaskInput<ITaskAppData> = {
      id: uuid(),
      boardId,
      sort: null,
      taskSchema: null,
      fileValues: [],
      listValues: [],
      scalarValues: [],
      appData: {
         pluginAdo: {
            workItemId: workItem.id
         }
      }
   };

   for (const referenceName of Object.getOwnPropertyNames(inputMapping)) {
      const value = workItem.fields[referenceName];
      if (!value) { continue; }
      const input = inputMapping[referenceName];

      switch (input.type) {
         case InputType.Select:
         case InputType.Text: {
            const scalarValue: IScalarValue = {
               id: uuid(),
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

   return newTask;
}