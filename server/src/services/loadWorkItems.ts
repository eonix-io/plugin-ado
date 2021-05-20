import { WorkItem, WorkItemBatchGetRequest, WorkItemExpand } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';
import { WorkItemTrackingApi } from 'azure-devops-node-api/WorkItemTrackingApi';

/** Loads all requested ids in batches of 200 at a time. Invokes callback with each batch. Returns a promise that resolves when all batches have been loaded */
export async function loadWorkItems(client: WorkItemTrackingApi, project: string, idsToLoad: number[], batchCallback: (workItems: WorkItem[]) => void | Promise<void>): Promise<void> {

   let batchNum = 0;

   const getWorkItemRequest = () => {
      const start = batchNum * 200;
      let end = start + 200;
      if (end > idsToLoad.length) { end = idsToLoad.length; }
      if (start >= end) { return null; }
      const ids = idsToLoad.slice(start, end);
      return {
         ids,
         $expand: WorkItemExpand.Relations
      } as WorkItemBatchGetRequest;
   };

   let request = getWorkItemRequest();
   let lastCallbackResult: void | Promise<void> | undefined;
   while (request) {
      await Promise.resolve(lastCallbackResult);
      const batchItems = await client.getWorkItemsBatch(request, project);
      lastCallbackResult = batchCallback(batchItems);
      batchNum++;
      request = getWorkItemRequest();
   }
}