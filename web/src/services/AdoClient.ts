import { IVssRestClientOptions } from 'azure-devops-extension-api';
import { CoreRestClient, TeamProjectReference } from 'azure-devops-extension-api/Core';
import { GetFieldsExpand, WorkItem, WorkItemBatchGetRequest, WorkItemExpand, WorkItemField, WorkItemTrackingRestClient, WorkItemType } from 'azure-devops-extension-api/WorkItemTracking';
import { reactive, ref, Ref } from 'vue';

export class AdoClient {

   private constructor(private readonly _restOptions: IVssRestClientOptions, private _projects: Promise<TeamProjectReference[]>, public readonly token: string) { }

   public static async connect(projectUrl: string, token: string): Promise<AdoClient> {
      const options: IVssRestClientOptions = {
         rootPath: projectUrl,
         authTokenProvider: {
            getAuthorizationHeader() {
               return Promise.resolve(`Basic ${btoa(`:${token}`)}`);
            }
         }
      };


      const coreClient = new CoreRestClient(options);
      const projects = await coreClient.getProjects();

      return new AdoClient(options, Promise.resolve(projects), token);
   }

   public get projectUrl() { return this._restOptions.rootPath as string; }

   public getProjects(): Promise<TeamProjectReference[]> {
      if (this._projects) { return this._projects; }
      return this._projects;
   }

   private _workItemTypes: Map<string, Ref<WorkItemType[] | null>> = new Map();
   public getWorkItemTypes(project: string): Ref<WorkItemType[] | null> {
      let types = this._workItemTypes.get(project);
      if (types) { return types; }
      this._workItemTypes.set(project, types = ref(null));
      const workItemClient = new WorkItemTrackingRestClient(this._restOptions);
      workItemClient.getWorkItemTypes(project).then(ts => types!.value = ts.sort((a, b) => a.name.localeCompare(b.name)));

      return types!;
   }

   private _workItems: Map<string, Ref<WorkItem[]>> = new Map();
   public getWorkItems(project: string): Ref<WorkItem[]> {

      let workItems = this._workItems.get(project);
      if (workItems) { return workItems; }

      workItems = ref(reactive([]));
      this._workItems.set(project, workItems);

      (async () => {
         const maxItemsToLoad = 1000;

         const client = new WorkItemTrackingRestClient(this._restOptions);

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
               $expand: WorkItemExpand.Relations
            } as WorkItemBatchGetRequest;
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


   private _workItemFields: Map<string, Ref<WorkItemField[] | null>> = new Map();
   public getWorkItemFields(): Ref<WorkItemField[] | null> {
      let workItemFields = this._workItemFields.get('');
      if (workItemFields) { return workItemFields; }

      this._workItemFields.set('', workItemFields = ref(null));
      //When project changes, get list of workItemTypes
      const workItemClient = new WorkItemTrackingRestClient(this._restOptions);
      workItemClient.getFields(undefined, GetFieldsExpand.ExtensionFields).then(f => {
         f.sort((a, b) => a.name.localeCompare(b.name));
         workItemFields!.value = f;
      });

      return workItemFields;

   }

}

