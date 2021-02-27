<template>
   <ado-config :boardId="boardId"></ado-config>
</template>

<script lang="ts">
   import { uuidEmpty } from '@eonix-io/client';
   import { defineComponent } from 'vue';
   import AdoConfig from './components/AdoConfig.vue';

   export default defineComponent({
      name: 'App',
      components: {
         AdoConfig
      },
      setup() {
         const boardId = uuidEmpty;

         return { boardId };
      }
   });
</script>
