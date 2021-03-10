
<template>
   <div class="container-fluid">
      <connection-info @connected="onConnect"></connection-info>
      <div class="row" v-if="teamProjects">
         <div class="col">
            <div class="form-floating">
               <select class="form-select" id="projectSelect" v-model="project">
                  <option :value="null">Select project</option>
                  <option v-for="p of teamProjects" :key="p.id" :value="p">{{p.name}}</option>
               </select>
               <label for="projectSelect">Project</label>
            </div>
         </div>
      </div>
      <div class="row" v-if="project && !workItemTypes">
         <div class="col">
            Loading work item types for {{project.name}}
         </div>
      </div>
      <div class="row" v-if="workItemTypes">
         <div class="col item-types">
            <div class="form-check form-check-inline" v-for="it of workItemTypes" :key="it.name">
               <input class="" type="checkbox" :id="getWorkItemTypeId(it)" :checked="selectedWorkItemTypes.includes(it)" @change="toggleWorkItemSelection(it)">
               <label class="ms-2" :for="getWorkItemTypeId(it)">
                  <img :src="it.icon.url">
                  <span class="ms-2">{{it.name}}</span>
               </label>
            </div>
         </div>
      </div>
      <div class="row mappings" v-if="mappings && filteredMappings">
         <div class="col">

            <h3 class="d-inline-block mb-2">ADO Fields</h3>
            <div class="d-inline-block ms-3">
               <input type="checkbox" v-model="mappingFilters.hasValue" for="hideValuelessFilter">
               <label for="hideValuelessFilter">Hide fields with no values</label>
            </div>

            <div class="list-group list-group-flush">
               <div role="button" class="list-group-item list-group-item-action" v-for="m of filteredMappings" :key="m.referenceName" @click="selectedReferenceName = m.referenceName">
                  <div class="row mb-0">
                     <div class="col">
                        <div>
                           <span :class="{'fw-bold': m.hasValues}">{{m.referenceName}}</span>
                        </div>
                        <div>{{m.helpText}}</div>
                     </div>
                  </div>
               </div>
            </div>

         </div>
      </div>

      <field-modal v-if="selectedField" :field="selectedField" @close="selectedReferenceName=null"></field-modal>
   </div>
</template>

<script lang="ts">

   import { computed, defineComponent, provide, reactive, ref, watch } from 'vue';
   import type { TeamProjectReference } from 'azure-devops-extension-api/Core';
   import type { WorkItemType } from 'azure-devops-extension-api/WorkItemTracking';
   import { useFieldMappings } from './useFieldMappings';
   import FieldModal from './FieldModal.vue';
   import { AdoClient } from '@/services';
   import ConnectionInfo from './ConnectionInfo.vue';

   export default defineComponent({
      components: { FieldModal, ConnectionInfo },
      props: {
         //boardId: { type: String as () => UUID, required: true }
      },
      setup() {

         const adoClient = ref<AdoClient | null>(null);
         provide('ADO_CLIENT', adoClient);
         const teamProjects = ref<TeamProjectReference[] | null>(null);

         const onConnect = async (client: AdoClient) => {
            adoClient.value = client;
            teamProjects.value = await client.getProjects();
         };

         const project = ref<TeamProjectReference | null>(null);
         watch(teamProjects, projects => {
            if (!projects) {
               project.value = null;
               return;
            }
            if (process.env?.VUE_APP_TEST_PROJECT) { project.value = projects.find(p => p.name === process.env?.VUE_APP_TEST_PROJECT) ?? null; }
         });

         const workItemTypes = computed(() => {
            if (!adoClient.value) { return null; }
            if (!project.value) { return null; }
            return adoClient.value.getWorkItemTypes(project.value.name).value;
         });

         watch(workItemTypes, itemTypes => {
            selectedWorkItemTypes.value = [];
            selectedReferenceName.value = null;
            if (!itemTypes) { return; }
            if (!process.env?.VUE_APP_TEST_TYPES) { return; }
            const testTypes = itemTypes.filter(t => (process.env.VUE_APP_TEST_TYPES as string).includes(t.name));
            testTypes.forEach(t => toggleWorkItemSelection(t));
         });

         /** Get a HTML friendly id for a WorkItemType to be used for checkbox id */
         const getWorkItemTypeId = (it: WorkItemType): string => {
            return it.name.toLowerCase().replaceAll(' ', '-');
         };

         const workItems = computed(() => {
            if (!adoClient.value) { return null; }
            if (!project.value) { return null; }
            return adoClient.value.getWorkItems(project.value.name).value;
         });

         const selectedWorkItemTypes = ref<WorkItemType[]>([]);

         /** Called when a WorkItemType checkbox is un/checked */
         const toggleWorkItemSelection = (it: WorkItemType): void => {
            const i = selectedWorkItemTypes.value.indexOf(it);
            if (i === -1) {
               selectedWorkItemTypes.value.push(it);
            } else {
               selectedWorkItemTypes.value.splice(i, 1);
            }
         };

         const mappings = useFieldMappings(selectedWorkItemTypes, workItems);

         const mappingFilters = reactive({
            hasValue: true
         });

         const filteredMappings = computed(() => {
            return mappings.value?.filter(v => {
               if (mappingFilters.hasValue && !v.hasValues) { return false; }
               return true;
            });
         });

         const fields = computed(() => {
            if (!adoClient.value) { return null; }
            const fields = adoClient.value.getWorkItemFields();
            return fields.value;
         });

         const selectedReferenceName = ref<string | null>(null);
         const selectedField = computed(() => fields.value?.find(f => f.referenceName === selectedReferenceName.value) ?? null);

         return { teamProjects, onConnect, project, workItemTypes, getWorkItemTypeId, selectedWorkItemTypes, toggleWorkItemSelection, mappings, filteredMappings, mappingFilters, selectedReferenceName, selectedField };

         // const client = inject<EonixClient>(EONIX_CLIENT_INJECTION_KEY)!;
         // const boardQ = boardQuery(props.boardId);
         // const board = ref<IBoard | null>(null);
         // const board$ = client.watchQuery(boardQ).subscribe(b => {
         //    board.value = b.board;
         // });
         // onUnmounted(() => board$.unsubscribe());

         // return { board };

      }
   });


</script>

<style lang="postcss" scoped>
   .item-types,
   .mappings {
      img {
         height: 1rem;
         width: 1rem;
      }
   }
</style>