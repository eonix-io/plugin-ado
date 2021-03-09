
<template>
   <ex-modal>
      {{referenceName}}
   </ex-modal>
</template>

<script lang="ts">

   import { AdoClient } from '@/services';
   import { defineComponent } from 'vue';

   export default defineComponent({
      props: {
         client: { type: Object as () => AdoClient, required: true },
         referenceName: { type: String, require: true }
      },
      setup() {
         return {};
      }
   });

</script>
