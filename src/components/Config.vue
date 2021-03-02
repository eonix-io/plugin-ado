
<template>
   <div class="container-fluid">
      <div class="row">
         <div class="col">
            <div class="form-floating">
               <input class="form-control" id="organizationUrl" placeholder="*" v-model="organizationUrl">
               <label for="organizationUrl">Organization URL</label>
            </div>
         </div>
      </div>
      <div class="row">
         <div class="col">
            <div class="form-floating">
               <input class="form-control" id="token" placeholder="*" v-model="token">
               <label for="token">Token</label>
            </div>
         </div>
      </div>
      <div class="row" v-if="token && organizationUrl">
         <div class="col">
            <button class="btn btn-primary" :disabled="isConnecting" @click="connect">Connect</button>
         </div>
      </div>
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
      <div class="row" v-if="loadingTasksMessage">
         <div class="col">
            {{loadingTasksMessage}}
         </div>
      </div>
      <div class="row mappings" v-if="mappings && workItemFields">
         <div class="col">

            <h3 class="d-inline-block mb-2">ADO Fields</h3>
            <div class="d-inline-block ms-3">
               <input type="checkbox" v-model="mappingFilters.hasValue" for="hideValuelessFilter">
               <label for="hideValuelessFilter">Hide fields with no values</label>
            </div>

            <div class="row">
               <div class="col">
                  <div class="form-floating"><input class="form-control" placeholder="*" v-model.number.lazy="taskId">
                     <label>Display values from Task Id</label>
                  </div>
               </div>
            </div>

            <div class="list-group list-group-flush">
               <div class="list-group-item" v-for="m of filteredMappings" :key="m.referenceName">
                  <div class="row mb-0">
                     <div class="col-3">
                        <div>
                           <span :class="{'fw-bold': m.hasValues}">{{m.name}}</span>
                           <img v-for="i of m.itemTypes" :key="i.iconUrl" :src="i.iconUrl">
                        </div>
                        <div>{{m.helpText}}</div>
                     </div>
                     <div class="col text-break">
                        {{taskValues[m.referenceName]}}
                     </div>
                     <div class="col-4">
                        <div class="form-floating">
                           <select class="form-control" placeholder="*" @click.stop>
                              <option>Ignore</option>
                              <option>Create New</option>
                           </select>
                           <label>Eonix Input</label>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

         </div>
      </div>
   </div>
</template>

<script lang="ts">

   import { computed, defineComponent, reactive, ref, watch } from 'vue';
   import { CoreRestClient, TeamProjectReference } from 'azure-devops-extension-api/Core';
   import type { IVssRestClientOptions } from 'azure-devops-extension-api/Common/Context';
   import { WorkItemType } from 'azure-devops-extension-api/WorkItemTracking';
   import { useWorkItems } from './useWorkItems';
   import { useWorkItemTypes } from './useWorkItemTypes';
   import { useFieldMappings } from './useFieldMappings';

   export default defineComponent({
      props: {
         //boardId: { type: String as () => UUID, required: true }
      },
      setup() {

         const organizationUrl = ref<string>(process.env.VUE_APP_TEST_ORG_URL?.trimEnd('/') + '/' ?? '');
         const token = ref<string>(process.env.VUE_APP_TEST_TOKEN ?? '');

         const restOptions = computed<IVssRestClientOptions>(() => {
            return {
               rootPath: organizationUrl.value,
               authTokenProvider: {
                  getAuthorizationHeader() {
                     return Promise.resolve(`Basic ${btoa(`:${token.value}`)}`);
                  }
               }
            };
         });

         watch(token, () => teamProjects.value = null);
         watch(organizationUrl, () => teamProjects.value = null);

         const connectError = ref<string | null>(null);
         const teamProjects = ref<TeamProjectReference[] | null>(null);
         const isConnecting = ref(false);
         const connect = async () => {
            isConnecting.value = true;
            connectError.value = null;
            teamProjects.value = null;
            const coreClient = new CoreRestClient(restOptions.value);
            try {
               teamProjects.value = await coreClient.getProjects();
            } catch (e) {
               console.error('Error getting projects', e);
               connectError.value = 'Error getting project listing. This usually means that your project url or token is incorrect';
            } finally {
               isConnecting.value = false;
            }
         };

         const project = ref<TeamProjectReference | null>(null);
         watch(teamProjects, projects => {
            if (!projects) {
               project.value = null;
               return;
            }
            if (process.env?.VUE_APP_TEST_PROJECT) { project.value = projects.find(p => p.name === process.env?.VUE_APP_TEST_PROJECT) ?? null; }
         });

         const workItemTypes = useWorkItemTypes(project, restOptions);

         watch(workItemTypes, itemTypes => {
            selectedWorkItemTypes.value = [];
            if (!itemTypes) { return; }
            if (!process.env?.VUE_APP_TEST_TYPES) { return; }
            const testTypes = itemTypes.filter(t => (process.env.VUE_APP_TEST_TYPES as string).includes(t.name));
            testTypes.forEach(t => toggleWorkItemSelection(t));
         });

         /** Get a HTML friendly id for a WorkItemType to be used for checkbox id */
         const getWorkItemTypeId = (it: WorkItemType): string => {
            return it.name.toLowerCase().replaceAll(' ', '-');
         };

         const reportFiels = computed(() => {
            if (!workItemTypes.value) { return null; }
            const fields = workItemTypes.value.flatMap(t => t.fields.map(f => f.referenceName));
            return fields;
         });

         const { workItems: workItemFields, status: loadingTasksMessage } = useWorkItems(project, reportFiels, restOptions, 600);

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

         const mappings = useFieldMappings(selectedWorkItemTypes, workItemFields);

         const mappingFilters = reactive({
            hasValue: true
         });
         const filteredMappings = computed(() => {
            return mappings.value?.filter(v => {
               if (mappingFilters.hasValue && !v.hasValues) { return false; }
               return true;
            });
         });

         const taskId = ref<number | null>(process.env.VUE_APP_TEST_TASK_ID ? parseInt(process.env.VUE_APP_TEST_TASK_ID) : null);
         const taskValues = computed(() => {
            const ret: Record<string, string | null | undefined> = {};
            if (!filteredMappings.value || !workItemFields.value || !taskId.value) { return ret; }
            for (const field of filteredMappings.value) {
               const fieldValues = workItemFields.value[field.referenceName];
               const value = fieldValues?.find(v => v.itemId == taskId.value);
               ret[field.referenceName] = value?.value;
            }
            return ret;
         });

         return { organizationUrl, token, connect, connectError, teamProjects, project, workItemTypes, isConnecting, getWorkItemTypeId, selectedWorkItemTypes, toggleWorkItemSelection, mappings, loadingTasksMessage, workItemFields, filteredMappings, mappingFilters, taskId, taskValues };

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