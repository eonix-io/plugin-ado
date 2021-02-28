
<template>
   <div class="container-fluid">
      <div class="row">
         <div class="col">
            <div class="form-floating">
               <input class="form-control" id="projectUrl" placeholder="*" v-model="projectUrl">
               <label for="projectUrl">Project URL</label>
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
      <div class="row">
         <div class="col">
            <button class="btn btn-primary" @click="connect">Connect</button>
         </div>
      </div>
   </div>
</template>

<script lang="ts">

   import { computed, defineComponent, ref } from 'vue';
   import { CoreRestClient } from 'azure-devops-extension-api/Core';

   export default defineComponent({
      props: {
         //boardId: { type: String as () => UUID, required: true }
      },
      setup() {

         const projectUrl = ref<string>(import.meta.env.VITE_ADO_PROJECT?.toString() ?? '');
         const token = ref<string>(import.meta.env.VITE_ADO_TOKEN?.toString() ?? '');

         const auth = computed(() => 'Basic ' + btoa(`:${token.value}`));

         const connect = async () => {
            const coreClient = new CoreRestClient({
               rootPath: projectUrl.value,
               authTokenProvider: {
                  getAuthorizationHeader() {
                     return Promise.resolve(`Basic ${auth.value}`);
                  }
               }
            });
            const projects = await coreClient.getProjects();
            console.log(projects);
         };

         return { projectUrl, token, connect };

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
