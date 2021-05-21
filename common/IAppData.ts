
export interface IInputAppData {
   pluginAdo?: {
      /** The ADO field reference name */
      referenceName: string;
   } | null;
}

export interface IBoardAppData {
   pluginAdo?: {
      orgUrl: string;
      token: string;
      project: string;
      taskTypes: string[];
   } | null;
}

export interface ITaskAppData {
   pluginAdo?: {
      workItemId: number;
      /** Key=referenceName, Value=Hash of the field's original value  */
      valueHash: Record<string, string>
   };
}