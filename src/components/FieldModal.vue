
<template>
   <ex-modal>
      <div v-if="field">
         {{field.name}}
      </div>
   </ex-modal>
</template>

<script lang="ts">

   import type { WorkItemField } from 'azure-devops-extension-api/WorkItemTracking';
   import { defineComponent } from 'vue';

   export default defineComponent({
      props: {
         field: { type: Object as () => WorkItemField, required: true }
      },
      setup() {
         return {};
      }
   });

</script>
