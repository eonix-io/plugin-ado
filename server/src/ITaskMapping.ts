import { ITask } from '@eonix-io/client';

/** A mapping of all existing tasks by their workItemId */
export interface ITaskMapping<AppDataType> {
   [key: number]: ITask<AppDataType>
}