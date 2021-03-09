
<template>
   <ex-modal>
      <div v-if="field">
         {{field.name}}
      </div>
   </ex-modal>
</template>

<script lang="ts">

   import type { AdoClient } from '@/services';
   import { WorkItemField } from 'node_modules/azure-devops-extension-api/WorkItemTracking';
   import { computed, defineComponent, inject, Ref } from 'vue';

   export default defineComponent({
      props: {
         field: { type: Object as () => WorkItemField, required: true }
      },
      setup(props) {

         const client = inject<Ref<AdoClient>>('ADO_CLIENT')!.value;
         const fields = client.getWorkItemFields();

         const field = computed(() => {
            const thisField = fields.value?.find(f => f.referenceName === props.referenceName);
            return thisField ?? null;
         });

         return { field };
      }
   });

</script>
