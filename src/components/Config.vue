
<template>
   <div class="container-fluid">
      <div class="row">
         <div class="col">
            <div class="form-floating">
               <input class="form-control" id="token" placeholder="*" v-model="token">
               <label for="token">Token</label>
            </div>
         </div>
      </div>
   </div>
</template>

<script lang="ts">

   import { defineComponent, ref } from 'vue';

   export default defineComponent({
      props: {
         //boardId: { type: String as () => UUID, required: true }
      },
      setup() {


         const token = ref<string>(import.meta.env.VITE_ADO_TOKEN?.toString() ?? '');

         return { token };

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
