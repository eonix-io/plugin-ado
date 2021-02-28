
import { IVssRestClientOptions } from 'azure-devops-extension-api';
import { TeamProjectReference } from 'azure-devops-extension-api/Core';
import { WorkItemTrackingRestClient, WorkItemType } from 'azure-devops-extension-api/WorkItemTracking';
import { ref, watch, Ref } from 'vue';

export function useWorkItemTypes(project: Ref<TeamProjectReference | null>, restOptions: Ref<IVssRestClientOptions>): Ref<WorkItemType[] | null> {
   const workItemTypes = ref<WorkItemType[] | null>(null);

   //When project changes, get list of workItemTypes
   watch(project, async project => {
      workItemTypes.value = null;
      if (!project) { return; }
      const workItemClient = new WorkItemTrackingRestClient(restOptions.value);
      const itemTypes = await workItemClient.getWorkItemTypes(project.name);
      itemTypes.sort((a, b) => a.name.localeCompare(b.name));
      workItemTypes.value = itemTypes;
   });

   return workItemTypes;
}