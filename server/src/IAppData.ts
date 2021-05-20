
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