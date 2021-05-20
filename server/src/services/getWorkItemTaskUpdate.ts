import { ITask, ITaskInput } from '@eonix-io/client';
import { WorkItem } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';
import { IInputMapping } from '../IInputMapping';

/** Creates/Updates a board task from a ADO work item. Returns null if no change is needed */
export function getWorkItemTaskUpdate(inputMapping: IInputMapping, tasks: ITask[], workItem: WorkItem): ITaskInput | null {
   return null;
}