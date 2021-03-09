import { IVssRestClientOptions } from 'azure-devops-extension-api';
import { GetFieldsExpand, WorkItemField, WorkItemTrackingRestClient } from 'azure-devops-extension-api/WorkItemTracking';
import { Ref, ref, watch } from 'vue';

let workItemFields: Ref<WorkItemField[] | null> | undefined;
export function useWorkItemFields(restOptions: Ref<IVssRestClientOptions>): Ref<WorkItemField[] | null> {

   if (!workItemFields) {
      workItemFields = ref(null);
      //When project changes, get list of workItemTypes
      watch(restOptions, async opts => {
         workItemFields!.value = null;
         const workItemClient = new WorkItemTrackingRestClient(opts);
         const fields = await workItemClient.getFields(undefined, GetFieldsExpand.ExtensionFields);
         fields.sort((a, b) => a.name.localeCompare(b.name));
         workItemFields!.value = fields;
      });
   }

   return workItemFields;
}