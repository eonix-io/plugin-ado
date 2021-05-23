
import * as AdoCore from 'azure-devops-extension-api/bin/Core';
import * as AdoWit from 'azure-devops-extension-api/bin/WorkItemTracking';
import { reactive, ref, Ref } from 'vue';


/**
 * Interface for a class that can retrieve authorization tokens to be used in fetch requests.
 */
export interface IAuthorizationTokenProvider {
   /**
    * Gets the authorization header to use in a fetch request
    *
    * @param forceRefresh - If true, indicates that we should get a new token, if applicable for current provider.
    * @returns the value to use for the Authorization header in a request.
    */
   getAuthorizationHeader(forceRefresh?: boolean): Promise<string>;
}


/**
 * Options for a specific instance of a REST client.
 */
export interface IVssRestClientOptions {

   /**
   * Auth token manager that can be used to get and attach auth tokens to requests.
   * If not supplied, the default token provider is used if the serviceInstanceType option is supplied
   * and is different from the hosting page's service instance type.
   */
   authTokenProvider?: IAuthorizationTokenProvider;

   /**
    * The root URL path to use for this client. Can be relative or absolute.
    */
   rootPath?: string | Promise<string>;

   /**
    * Current session id.
    */
   sessionId?: string;

   /**
    * Current command for activity logging.
    */
   command?: string;
}

export class AdoClient {

   private constructor(private readonly _restOptions: IVssRestClientOptions, private _projects: Promise<AdoCore.TeamProjectReference[]>, public readonly token: string) { }

   public static async connect(projectUrl: string, token: string): Promise<AdoClient> {
      const options: IVssRestClientOptions = {
         rootPath: projectUrl,
         authTokenProvider: {
            getAuthorizationHeader() {
               return Promise.resolve(`Basic ${btoa(`:${token}`)}`);
            }
         }
      };


      const coreClient = new AdoCore.CoreRestClient(options);
      const projects = await coreClient.getProjects();

      return new AdoClient(options, Promise.resolve(projects), token);
   }

   public get projectUrl() { return this._restOptions.rootPath as string; }

   public getProjects(): Promise<AdoCore.TeamProjectReference[]> {
      if (this._projects) { return this._projects; }
      return this._projects;
   }

   private _workItemTypes: Map<string, Ref<AdoWit.WorkItemType[] | null>> = new Map();
   public getWorkItemTypes(project: string): Ref<AdoWit.WorkItemType[] | null> {
      let types = this._workItemTypes.get(project);
      if (types) { return types; }
      this._workItemTypes.set(project, types = ref(null));
      const workItemClient = new AdoWit.WorkItemTrackingRestClient(this._restOptions);
      workItemClient.getWorkItemTypes(project).then(ts => types!.value = ts.sort((a, b) => a.name.localeCompare(b.name)));

      return types!;
   }

   private _workItems: Map<string, Ref<AdoWit.WorkItem[]>> = new Map();
   public getWorkItems(project: string): Ref<AdoWit.WorkItem[]> {

      let workItems = this._workItems.get(project);
      if (workItems) { return workItems; }

      workItems = ref(reactive([]));
      this._workItems.set(project, workItems);

      (async () => {
         const maxItemsToLoad = 1000;

         const client = new AdoWit.WorkItemTrackingRestClient(this._restOptions);

         const wiqlResult = await client.queryByWiql({ query: 'Select [Id] From WorkItems order by [System.CreatedDate] desc' }, project);

         const allIds = wiqlResult.workItems.map(wi => wi.id);

         let batchNum = 0;

         const getWorkItemRequest = () => {
            const start = batchNum * 200;
            if (start > maxItemsToLoad) { return null; }
            let end = start + 200;
            if (end > allIds.length) { end = allIds.length; }
            if (end > maxItemsToLoad) { end = maxItemsToLoad; }
            if (start >= end) { return null; }
            const ids = allIds.slice(start, end);
            return {
               ids,
               $expand: AdoWit.WorkItemExpand.Relations
            } as AdoWit.WorkItemBatchGetRequest;
         };

         let request = getWorkItemRequest();
         while (request) {
            const batchItems = await client.getWorkItemsBatch(request, project);
            workItems.value.push(...batchItems);
            batchNum++;
            request = getWorkItemRequest();
         }

      })();

      return workItems;
   }


   private _workItemFields: Map<string, Ref<AdoWit.WorkItemField[] | null>> = new Map();
   public getWorkItemFields(): Ref<AdoWit.WorkItemField[] | null> {
      let workItemFields = this._workItemFields.get('');
      if (workItemFields) { return workItemFields; }

      this._workItemFields.set('', workItemFields = ref(null));
      //When project changes, get list of workItemTypes
      const workItemClient = new AdoWit.WorkItemTrackingRestClient(this._restOptions);
      workItemClient.getFields(undefined, AdoWit.GetFieldsExpand.ExtensionFields).then(f => {
         f.sort((a, b) => a.name.localeCompare(b.name));
         workItemFields!.value = f;
      });

      return workItemFields;

   }

}

