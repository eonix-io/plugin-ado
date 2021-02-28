
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
         <div class="col">
            <ul>
               <li v-for="itemType of workItemTypes" :key="itemType">{{itemType.name}}</li>
            </ul>
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

         const organizationUrl = ref<string>(process.env.VUE_APP_ADO_ORG_URL?.toString()?.trimEnd('/') + '/' ?? '');
         const token = ref<string>(process.env.VUE_APP_ADO_TOKEN?.toString() ?? '');

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
               console.log(teamProjects.value);
            } catch (e) {
               console.error('Error getting projects', e);
               connectError.value = 'Error getting project listing. This usually means that your project url or token is incorrect';
            } finally {
               isConnecting.value = false;
            }
         };

         watch(teamProjects, projects => {
            if (!projects) { project.value = null; }
         });

         const project = ref<TeamProjectReference | null>(null);

         const workItemTypes = ref<WorkItemType[] | null>(null);

         watch(project, async project => {
            workItemTypes.value = null;
            if (!project) { return; }
            const workItemClient = new WorkItemTrackingRestClient(restOptions.value);
            const itemTypes = await workItemClient.getWorkItemTypes(project.name);
            itemTypes.sort((a, b) => a.name.localeCompare(b.name));
            workItemTypes.value = itemTypes;
         });



         return { organizationUrl, token, connect, connectError, teamProjects, project, workItemTypes, isConnecting };

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
