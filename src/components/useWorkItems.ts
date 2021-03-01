
import { IVssRestClientOptions } from 'azure-devops-extension-api/Common/Context';
import { TeamProjectReference } from 'azure-devops-extension-api/Core';
import { WorkItem, WorkItemBatchGetRequest, WorkItemExpand, WorkItemTrackingRestClient } from 'azure-devops-extension-api/WorkItemTracking';
import { ref, Ref, watch } from 'vue';

/** Loads WorkItems (tasks) for a project and aggregates the values into an object by the field's referenceName */
export function useWorkItems(project: Ref<TeamProjectReference | null>, fields: Ref<string[] | null>, restOptions: Ref<IVssRestClientOptions>, maxItemsToLoad: number): { workItems: Ref<WorkItemFields | null>, status: Ref<string | null> } {

   const status = ref<string | null>(null);
   const workItems = ref<WorkItemFields | null>(null);

   watch([project, fields], async results => {

      const [thisProject, fields] = results;

      workItems.value = null;
      if (!thisProject || !fields) {
         return;
      }

      const client = new WorkItemTrackingRestClient(restOptions.value);

      status.value = 'Loading workitem id list';
      const wiqlResult = await client.queryByWiql({ query: 'Select [Id] From WorkItems order by [System.CreatedDate] desc' }, thisProject.name);
      if (project.value !== thisProject) { return; }

      const allIds = wiqlResult.workItems.map(wi => wi.id);

      let batchNum = 0;
      status.value = `Loading tasks batch ${batchNum + 1}`;

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

      workItems.value = {};
      let request = getWorkItemRequest();
      while (request) {
         status.value = `Loading tasks batch ${batchNum + 1}`;
         const batchItems = await client.getWorkItemsBatch(request, thisProject.name);
         if (project.value !== thisProject) { return; }
         workItems.value = aggregate(workItems.value, batchItems);
         batchNum++;
         request = getWorkItemRequest();
      }

      status.value = null;
   });

   return { status, workItems };
}

function aggregate(wif: WorkItemFields, workItems: WorkItem[]): WorkItemFields {
   for (const t of workItems) {
      const fields = Object.getOwnPropertyNames(t.fields);
      for (const f of fields) {
         const value = t.fields[f];
         if (!value) { continue; }
         const fieldValues = wif[f] ??= [];
         fieldValues.push({
            itemType: t.fields['System.WorkItemType'],
            value,
            itemId: t.id
         });
      }
   }
   return wif;
}

export interface WorkItemFields {
   [fieldName: string]: {
      /** The work item type. Eg User Story */
      itemType: string;
      /** The given value for this field within the WorkItem */
      value: string;
      /** The id of the work item the value belongs to */
      itemId: number;
   }[]
}

/*
First attempt way of loading all tasks from the reporting endpoint. This works good until we needed the parent/child relationships and attachment links

      const filter: Partial<ReportingWorkItemRevisionsFilter> = {
         includeDeleted: false,
         includeLatestOnly: true,
         fields
      };

      let batchItems = await client.readReportingRevisionsPost(filter as ReportingWorkItemRevisionsFilter, thisProject.name);
      if (project.value !== thisProject) { return; }

      workItems.value = {};
      while (!batchItems.isLastBatch && project.value === thisProject && batchNum < batchLimit) {
         workItems.value = aggregate(workItems.value, batchItems.values);
         batchNum++;
         status.value = `Loading tasks batch ${batchNum}`;
         batchItems = await client.readReportingRevisionsPost(filter as ReportingWorkItemRevisionsFilter, thisProject.name, batchItems.continuationToken);
      }
      if (project.value !== thisProject) { return; }
*/