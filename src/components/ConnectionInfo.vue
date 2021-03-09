
<template>
   <div>
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
   </div>
</template>

<script lang="ts">

   import { defineComponent, ref } from 'vue';
   import { AdoClient } from '../services';

   export default defineComponent({
      props: {
      },
      emits: {
         'connected': (client: AdoClient) => !!client
      },
      setup(_, { emit }) {

         const organizationUrl = ref<string>(process.env.VUE_APP_TEST_ORG_URL ? process.env.VUE_APP_TEST_ORG_URL.trimEnd('/') + '/' : '');
         const token = ref<string>(process.env.VUE_APP_TEST_TOKEN ?? '');
         const isConnecting = ref(false);
         const connectError = ref<string | null>(null);

         const connect = async () => {
            isConnecting.value = true;
            connectError.value = null;
            try {
               const client = await AdoClient.connect(organizationUrl.value, token.value);
               emit('connected', client);
            } catch (e) {
               console.error('Error getting projects', e);
               connectError.value = 'Error getting project listing. This usually means that your project url or token is incorrect';
            } finally {
               isConnecting.value = false;
            }
         };

         return { organizationUrl, token, isConnecting, connectError, connect };
      }
   });

</script>
