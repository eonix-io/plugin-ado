
<template>
   <div v-if="board">
      {{board.name}}
   </div>
</template>

<script lang="ts">

   import { defineComponent, inject, onUnmounted, ref } from 'vue';
   import type { EonixClient, IBoard, UUID } from '@eonix-io/client';
   import { boardQuery, EONIX_CLIENT_INJECTION_KEY } from '@eonix-io/client';

   export default defineComponent({
      props: {
         boardId: { type: String as () => UUID, required: true }
      },
      setup(props) {

         const client = inject<EonixClient>(EONIX_CLIENT_INJECTION_KEY)!;
         const boardQ = boardQuery(props.boardId);
         const board = ref<IBoard | null>(null);
         const board$ = client.watchQuery(boardQ).subscribe(b => {
            board.value = b.board;
         });
         onUnmounted(() => board$.unsubscribe());

         return { board };
      }
   });

</script>
