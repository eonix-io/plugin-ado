import { WorkItem, WorkItemBatchGetRequest } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';
import { IBoardAppData } from '../IAppData';
import * as AzureDevOps from 'azure-devops-node-api';

/** Loads all requested ids in batches of 200 at a time. Invokes callback with each batch. Returns a promise that resolves when all batches have been loaded */
export async function loadWorkItems(adoPluginConfig: NonNullable<IBoardAppData['pluginAdo']>, fields: string[], batchCallback: (workItems: WorkItem[]) => void): Promise<void> {

   console.log('Creatinging work item ADO client');
   const adoAuthHandler = AzureDevOps.getPersonalAccessTokenHandler(adoPluginConfig.token);
   const adoConnection = new AzureDevOps.WebApi(adoPluginConfig.orgUrl, adoAuthHandler);
   const witClient = await adoConnection.getWorkItemTrackingApi();

   console.log('Getting work item ids');
   const wiqlResult = await witClient.queryByWiql({ query: 'Select [Id] From WorkItems order by [System.CreatedDate] desc' }, { projectId: adoPluginConfig.project });

   const allIds = wiqlResult.workItems?.map(wi => wi.id!) ?? [];
   //allIds = allIds.slice(0, 200);
   console.log('Got work item ids', allIds?.length);

   let batchNum = 0;

   const getWorkItemRequest = () => {
      const start = batchNum * 200;
      let end = start + 200;
      if (end > allIds.length) { end = allIds.length; }
      if (start >= end) { return null; }
      const ids = allIds.slice(start, end);
      return {
         ids,
         fields,
         //$expand: WorkItemExpand.Relations
      } as WorkItemBatchGetRequest;
   };

   let request = getWorkItemRequest();
   while (request) {
      //await Promise.resolve(lastCallbackResult);
      const batchItems = await witClient.getWorkItemsBatch(request, adoPluginConfig.project);
      batchCallback(batchItems);
      batchNum++;
      request = getWorkItemRequest();
   }
}