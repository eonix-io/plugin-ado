
<template>
   <ex-modal>
      <div v-if="field">

         <h1>{{field.name}}</h1>

         <div class="form-floating">
            <select class="form-control" placeholder="*" v-model="inputSelection">
               <option :value="null">Ignore</option>
               <option v-for="i of schemaInputs" :key="i.id" :value="i.id">{{i.name}}</option>
               <option value="new">New</option>
            </select>
            <label>Eonix Input</label>
         </div>

         <div v-if="inputSelection === 'new'" class="form-floating mt-3">
            <select class="form-control" placeholder="*">
               <option value="text">Text (Recommended)</option>
               <option value="boolean">Boolean</option>
               <option value="select">Select</option>
            </select>
            <label>Eonix Input</label>
         </div>

         <h3 class="mt-4">Example values</h3>
         <div class="list-group">
            <div class="list-group-item" v-for="v of fieldValues" :key="v.id">
               <div class="row">
                  <a href="#" target="_blank" class="col-2 mb-0">{{v.itemType}} {{v.id}}</a>
                  <span class="col mb-0">{{v.value}}</span>
               </div>
            </div>
         </div>

      </div>
   </ex-modal>
</template>

<script lang="ts">

   import { AdoClient } from '@/services';
   import { EonixClient, IInputBase, schemaForBoardQuery, UUID } from '@eonix-io/client';
   import type { WorkItemField } from 'azure-devops-extension-api/WorkItemTracking';
   import { computed, defineComponent, inject, onUnmounted, ref, Ref } from 'vue';

   export default defineComponent({
      props: {
         boardId: { type: String as () => UUID, required: true },
         project: { type: String, required: true },
         field: { type: Object as () => WorkItemField, required: true }
      },
      setup(props) {

         const adoClient = inject<Ref<AdoClient>>('ADO_CLIENT')!;
         const eonixClient = inject<EonixClient>('EONIX_CLIENT')!;

         const schemaInputs = ref<IInputBase[]>([]);
         const schemaQuery = schemaForBoardQuery(props.boardId);
         const schemaSx = eonixClient.watchQuery(schemaQuery).subscribe(s => {
            schemaInputs.value = [...s.schemaForBoard?.inputs ?? []];
            schemaInputs.value.sort((a, b) => a.name.localeCompare(b.name));
         });
         onUnmounted(() => schemaSx.unsubscribe());

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

         const inputSelection = ref<UUID | 'new' | null>(null);

         return { fieldValues, inputSelection, schemaInputs };
      }
   });

   interface FieldValueVm {
      id: number;
      value: string;
      itemType: string;
   }

</script>
