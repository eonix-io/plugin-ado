import { WorkItem, WorkItemBatchGetRequest, WorkItemExpand } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';
import { WorkItemTrackingApi } from 'azure-devops-node-api/WorkItemTrackingApi';

/** Loads all requested ids in batches of 200 at a time. Invokes callback with each batch. Returns a promise that resolves when all batches have been loaded */
export async function loadWorkItems(client: WorkItemTrackingApi, project: string, idsToLoad: number[], fields: string[], batchCallback: (workItems: WorkItem[]) => void | Promise<void>): Promise<void> {

   let batchNum = 0;

   const getWorkItemRequest = () => {
      const start = batchNum * 200;
      let end = start + 200;
      if (end > idsToLoad.length) { end = idsToLoad.length; }
      if (start >= end) { return null; }
      const ids = idsToLoad.slice(start, end);
      return {
         ids,
         fields,
         //$expand: WorkItemExpand.Relations
      } as WorkItemBatchGetRequest;
   };

   let request = getWorkItemRequest();
   let lastCallbackResult: void | Promise<void> | undefined;
   while (request) {
      //await Promise.resolve(lastCallbackResult);
      const batchItems = await client.getWorkItemsBatch(request, project);
      lastCallbackResult = batchCallback(batchItems);
      //This await shouldn't be here. I wanted to let this loop and start loading the next set while the currnet processes but the app just closes with no error when we try and call a fetch to download a task image.
      await Promise.resolve(lastCallbackResult);
      batchNum++;
      request = getWorkItemRequest();
   }
}