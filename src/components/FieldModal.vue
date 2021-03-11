
<template>
   <ex-modal>
      <div v-if="field">
         <h1>{{field.name}}</h1>
         <div>
            <h3>Example values</h3>
            <div class="list-group">
               <div class="list-group-item" v-for="v of fieldValues" :key="v.id">
                  <div class="row">
                     <a href="#" target="_blank" class="col-2 mb-0">{{v.itemType}} {{v.id}}</a>
                     <span class="col mb-0">{{v.value}}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </ex-modal>
</template>

<script lang="ts">

   import { AdoClient } from '@/services';
   import type { WorkItemField } from 'azure-devops-extension-api/WorkItemTracking';
   import { computed, defineComponent, inject, Ref } from 'vue';

   export default defineComponent({
      props: {
         project: { type: String, required: true },
         field: { type: Object as () => WorkItemField, required: true }
      },
      setup(props) {
         const adoClient = inject<Ref<AdoClient>>('ADO_CLIENT')!;
         const workItems = computed(() => adoClient.value.getWorkItems(props.project).value);

         const fieldValues = computed(() => {
            const values: FieldValueVm[] = [];

            for (const wi of workItems.value) {
               let v = wi.fields[props.field.referenceName];
               if (!v) { continue; }

               if (props.field.isIdentity) {
                  v = `${v.displayName} (${v.uniqueName})`;
               }

               if (values.some(x => x.value === v)) { continue; }

               values.push({
                  id: wi.id,
                  value: v,
                  itemType: wi.fields['System.WorkItemType']
               });

               if (values.length === 10) { break; }
            }

            return values;
         });

         return { fieldValues };
      }
   });

   interface FieldValueVm {
      id: number;
      value: string;
      itemType: string;
   }

</script>
