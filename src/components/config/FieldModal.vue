
<template>
   <ex-modal>
      {{referenceName}}
   </ex-modal>
</template>

<script lang="ts">

   import { IVssRestClientOptions } from 'node_modules/azure-devops-extension-api';
   import { defineComponent } from 'vue';

   export default defineComponent({
      props: {
         restOptions: { type: Object as () => IVssRestClientOptions, required: true },
         referenceName: { type: String, require: true }
      },
      setup() {
         return {};
      }
   });

</script>
