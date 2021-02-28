
import { IVssRestClientOptions } from 'azure-devops-extension-api/Common/Context';
import { TeamProjectReference } from 'azure-devops-extension-api/Core';
import { ReportingWorkItemRevisionsFilter, WorkItem, WorkItemTrackingRestClient } from 'azure-devops-extension-api/WorkItemTracking';
import { ref, Ref, watch } from 'vue';

/** Loads WorkItems (tasks) for a project and aggregates the values into an object by the field's referenceName */
export function useWorkItems(project: Ref<TeamProjectReference | null>, restOptions: Ref<IVssRestClientOptions>, batchLimit: number): { workItems: Ref<WorkItemFields | null>, status: Ref<string | null> } {

   const status = ref<string | null>(null);
   const workItems = ref<WorkItemFields | null>(null);

   watch(project, async thisProject => {

      workItems.value = null;
      if (!thisProject) {
         return;
      }

      const filter: Partial<ReportingWorkItemRevisionsFilter> = {
         includeDeleted: false,
         includeLatestOnly: true
      };

      let batchNum = 1;
      status.value = `Loading tasks batch ${batchNum}`;
      const client = new WorkItemTrackingRestClient(restOptions.value);

      let batchItems = await client.readReportingRevisionsPost(filter as ReportingWorkItemRevisionsFilter, thisProject.name);

      const allItems: WorkItem[] = [];
      while (!batchItems.isLastBatch && project.value === thisProject && batchNum < batchLimit) {
         allItems.push(...batchItems.values);
         batchNum++;
         status.value = `Loading tasks batch ${batchNum}`;
         batchItems = await client.readReportingRevisionsPost(filter as ReportingWorkItemRevisionsFilter, thisProject.name, batchItems.continuationToken);

      }

      if (project.value !== thisProject) {
         return;
      }

      workItems.value = {};
      [...allItems, ...batchItems.values].forEach(t => {
         const fields = Object.getOwnPropertyNames(t.fields);
         for (const f of fields) {
            const value = t.fields[f];
            if (!value) { continue; }
            const fieldValues = workItems.value![f] ??= [];
            fieldValues.push({
               itemType: t.fields['System.WorkItemType'],
               value
            });
         }
      });

      status.value = null;
   });

   return { status, workItems };
}



export interface WorkItemFields {
   [fieldName: string]: {
      /** The work item type. Eg User Story */
      itemType: string;
      /** The given value for this field within the WorkItem */
      value: string;
   }[]
}