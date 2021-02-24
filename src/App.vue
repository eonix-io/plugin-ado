<template>
   <ado-config></ado-config>
</template>

<script lang="ts">
   import { defineComponent } from 'vue';
   import AdoConfig from './components/AdoConfig.vue';

   export default defineComponent({
      name: 'App',
      components: {
         AdoConfig
      },
   });
</script>
