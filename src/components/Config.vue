
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
      <div class="row mappings" v-if="mappings">
         <div class="col">
            <div class="row" v-for="m of mappings" :key="m.referenceName">
               <div class="col">
                  {{m.name}}
                  <img v-for="i of m.usedTypeIconUrls" :key="i" :src="i">
               </div>
            </div>
         </div>
      </div>
   </div>
</template>

<script lang="ts">

   import { computed, defineComponent, ref, watch } from 'vue';
   import { CoreRestClient, TeamProjectReference } from 'azure-devops-extension-api/Core';
   import { IVssRestClientOptions } from 'azure-devops-extension-api/Common/Context';
   import { WorkItemTrackingRestClient, WorkItemType } from 'azure-devops-extension-api/WorkItemTracking';

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

         const workItemTypes = ref<WorkItemType[] | null>(null);

         //When project changes, get list of workItemTypes
         watch(project, async project => {
            workItemTypes.value = null;
            selectedWorkItemTypes.value = [];
            if (!project) { return; }
            const workItemClient = new WorkItemTrackingRestClient(restOptions.value);
            const itemTypes = await workItemClient.getWorkItemTypes(project.name);
            itemTypes.sort((a, b) => a.name.localeCompare(b.name));
            workItemTypes.value = itemTypes;
            if (process.env?.VUE_APP_TEST_TYPES) {
               const testTypes = itemTypes.filter(t => (process.env.VUE_APP_TEST_TYPES as string).includes(t.name));
               testTypes.forEach(t => toggleWorkItemSelection(t));
            }
         });

         const getWorkItemTypeId = (it: WorkItemType): string => {
            return it.name.toLowerCase().replaceAll(' ', '-');
         };

         const loadingTasksMessage = ref<string | null>(null);
         watch(project, async project => {
            loadingTasksMessage.value = 'Loading tasks';
         });

         const selectedWorkItemTypes = ref<WorkItemType[]>([]);

         const toggleWorkItemSelection = (it: WorkItemType): void => {
            const i = selectedWorkItemTypes.value.indexOf(it);
            if (i === -1) {
               selectedWorkItemTypes.value.push(it);
            } else {
               selectedWorkItemTypes.value.splice(i, 1);
            }
         };

         const mappings = computed<IFieldMapping[] | null>(() => {

            if (!selectedWorkItemTypes.value.length) { return null; }

            const dict: Record<string, IFieldMapping> = {};
            const sortedTypes = [...selectedWorkItemTypes.value].sort((a, b) => a.name.localeCompare(b.name));
            for (const type of sortedTypes) {
               for (const field of type.fields) {
                  let map = dict[field.referenceName];
                  if (!map) {
                     map = {
                        usedTypeIconUrls: [],
                        name: field.name,
                        helpText: field.helpText,
                        referenceName: field.referenceName
                     };
                     dict[field.referenceName] = map;
                  }
                  map.usedTypeIconUrls.push(type.icon.url);
               }
            }
            const values = Object.values(dict);
            values.sort((a, b) => a.name.localeCompare(b.name));
            return values;
         });

         return { organizationUrl, token, connect, connectError, teamProjects, project, workItemTypes, isConnecting, getWorkItemTypeId, selectedWorkItemTypes, toggleWorkItemSelection, mappings, loadingTasksMessage };

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

   interface IFieldMapping {
      name: string;
      referenceName: string;
      helpText: string;
      usedTypeIconUrls: string[];
   }

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