import { WorkItem, WorkItemType } from 'azure-devops-extension-api/WorkItemTracking';
import { computed, Ref } from 'vue';

export function useFieldMappings(selectedWorkItemTypes: Ref<WorkItemType[]>, workItems: Ref<WorkItem[] | null>): Ref<IFieldMapping[] | null> {
   return computed<IFieldMapping[] | null>(() => {

      if (!selectedWorkItemTypes.value.length) { return null; }

      const dict: Record<string, IFieldMapping> = {};
      const sortedTypes = [...selectedWorkItemTypes.value].sort((a, b) => a.name.localeCompare(b.name));
      for (const type of sortedTypes) {

         const typeWorkItems = workItems.value?.filter(wi => wi.fields['System.WorkItemType'] === type.name) ?? [];

         for (const field of type.fields) {
            let map = dict[field.referenceName];
            if (!map) {
               map = {
                  hasValues: false,
                  itemTypes: [],
                  name: field.name,
                  helpText: field.helpText,
                  referenceName: field.referenceName
               };
               dict[field.referenceName] = map;
            }


            const fieldValues = typeWorkItems.map(wi => wi.fields[field.referenceName]).reduce((prev, cur) => { if (cur) { prev.push(cur); } return prev; }, []);

            map.itemTypes.push({
               iconUrl: type.icon.url,
               numTasksWithValue: fieldValues.length
            });

            map.hasValues = map.itemTypes.some(t => t.numTasksWithValue);
         }
      }
      const values = Object.values(dict);
      values.sort((a, b) => a.name.localeCompare(b.name));
      return values;
   });
}

export interface IFieldMapping {
   name: string;
   referenceName: string;
   helpText: string;
   hasValues: boolean;
   itemTypes: IFieldItemType[];
}

export interface IFieldItemType {
   iconUrl: string;
   numTasksWithValue: number;
}