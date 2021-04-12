
<template>
   <ex-modal>
      <div v-if="field">

         <h1>{{field.name}}</h1>

         <div class="form-floating">
            <select class="form-control" placeholder="*" v-model="inputSelection">
               <option value="ignore">Ignore</option>
               <option v-for="i of schemaInputs" :key="i.id" :value="i.id">{{i.name}}</option>
               <option value="new">New</option>
            </select>
            <label>Eonix Input</label>
         </div>

         <div v-if="inputSelection === 'new'" class="form-floating mt-3">
            <select class="form-control" placeholder="*" v-model="inputType">
               <option value="text">Text (Recommended)</option>
               <option value="boolean">Boolean</option>
               <option value="select">Select</option>
            </select>
            <label>Eonix Input</label>
         </div>

         <div class="row mt-5" v-if="isFormDirty">
            <div class="col">
               <button
                       id='p-task-save'
                       class="w-100 btn btn-primary"
                       :class="{ 'btn-outline-secondary': !isFormDirty }"
                       :disabled="!isFormValid || !isFormDirty"
                       @click="save">Save</button>
            </div>
            <div class="col">
               <button
                       class="w-100 btn btn-secondary"
                       @click="cancel">{{isFormDirty ? 'Cancel' : 'Close' }}</button>
            </div>
         </div>

         <h3 class="mt-4">Example values</h3>
         <div class="list-group">
            <div class="list-group-item" v-for="v of fieldValues" :key="v.id">
               <div class="row">
                  <a href="#" target="_blank" class="col-2 mb-0">{{v.itemType}} {{v.id}}</a>
                  <span class="col mb-0">{{v.value}}</span>
               </div>
            </div>
         </div>

      </div>
   </ex-modal>
</template>

<script lang="ts">

   import { AdoClient } from '@/services';
   import { useQueryRef } from '@/services/useQueryRef';
   import { boardQuery, boardToBoardInput, deepClone, EonixClient, IInputBase, InputType, ISchema, isTextInput, ITextInput, ITextOptions, putBoardMutation, putSchemaMutation, schemaForBoardQuery, schemaToSchemaInput, TextType, uuid, UUID, uuidEmpty } from '@eonix-io/client';
   import type { WorkItemField } from 'azure-devops-extension-api/WorkItemTracking';
   import { computed, defineComponent, inject, ref, Ref, watch } from 'vue';
   import { IInputAppData } from './IAppData';

   export default defineComponent({
      props: {
         boardId: { type: String as () => UUID, required: true },
         project: { type: String, required: true },
         field: { type: Object as () => WorkItemField, required: true }
      },
      emits: {
         close: () => true
      },
      setup(props, { emit }) {

         const adoClient = inject<Ref<AdoClient>>('ADO_CLIENT')!;
         const eonixClient = inject<EonixClient>('EONIX_CLIENT')!;

         const schemaQuery = schemaForBoardQuery<any, IInputAppData>(props.boardId);
         const schema = useQueryRef(eonixClient.watchQuery(schemaQuery), null);

         const inputSelection = ref<UUID | 'new' | 'ignore'>('ignore');
         const schemaInputs = ref<IInputBase<IInputAppData>[]>([]);
         const originalInput = ref<IInputBase<IInputAppData> | null>(null);

         watch(schema, s => {
            if (!s?.schemaForBoard) { return; }

            console.debug('Existing schema loaded');
            schemaInputs.value = [...s.schemaForBoard.inputs ?? []];
            schemaInputs.value.sort((a, b) => a.name.localeCompare(b.name));

            originalInput.value = s.schemaForBoard.inputs.find(i => i.appData?.pluginAdo?.referenceName === props.field.referenceName) ?? null;
            if (originalInput.value) { inputSelection.value = originalInput.value.id; }
         }, { immediate: true });

         const board = useQueryRef(eonixClient.watchQuery(boardQuery(props.boardId)), null);

         const workItems = computed(() => adoClient.value.getWorkItems(props.project).value);

         const fieldValues = computed(() => {
            const values: FieldValueVm[] = [];

            for (const wi of workItems.value) {
               let v = wi.fields[props.field.referenceName];
               if (!v) { continue; }

               if (props.field.isIdentity) {
                  v = `${v.displayName} (${v.uniqueName})`;
               }

               if (values.some(x => x.value === v)) { continue; }

               values.push({
                  id: wi.id,
                  value: v,
                  itemType: wi.fields['System.WorkItemType']
               });

               if (values.length === 10) { break; }
            }

            return values;
         });

         watch(inputSelection, selection => {
            if (selection === 'new') {
               inputType.value = InputType.Text;
               return;
            }

            inputType.value = null;
         });

         const inputType = ref<InputType | null>(null);

         const isFormDirty = computed(() => {
            if (!originalInput.value && inputType.value) { return true; }
            return false;
         });

         const isSaving = ref(false);
         const isFormValid = computed(() => {
            if (isSaving.value) { return false; }
            return true;
         });

         const save = async () => {

            if (!board.value?.board) {
               console.error('Board did not exist');
               return;
            }

            try {

               isSaving.value = true;

               const newSchema: ISchema<any, IInputAppData> = deepClone(schema.value?.schemaForBoard) ?? {
                  id: uuid(),
                  name: '',
                  inputs: [],
                  appData: null,
                  createdBy: uuidEmpty,
                  createdDate: 0
               };

               let inputBase: IInputBase<IInputAppData> | null = null;

               switch (inputType.value!) {
                  case InputType.Text: {

                     const options: ITextOptions = isTextInput(originalInput.value) ? originalInput.value.options : {
                        type: TextType.Text,
                        maxLength: null
                     };

                     inputBase = {
                        type: InputType.Text,
                        id: originalInput.value?.id ?? uuid(),
                        name: originalInput.value?.name ?? props.field.referenceName,
                        appData: originalInput.value?.appData,
                        options
                     } as ITextInput;

                     break;
                  }
                  default: throw new Error(`${inputType.value} type not implemented`);
               }

               inputBase.appData = { ...inputBase.appData ?? {}, pluginAdo: { referenceName: props.field.referenceName } };

               const { schemaInput, inputs } = schemaToSchemaInput(newSchema);

               const existingIndex = inputs.findIndex(i => i.id === inputBase!.id);
               if (existingIndex !== -1) {
                  inputs.splice(existingIndex, 1, inputBase);
               } else {
                  inputs.push(inputBase);
               }

               const isNewSchema = !schema.value?.schemaForBoard;

               console.debug('Starting putSchemaMutation');
               const putSchemaProm = putSchemaMutation(eonixClient, schemaInput, inputs, props.boardId);

               if (isNewSchema) {
                  const boardInput = boardToBoardInput(board.value.board);
                  boardInput.schemaId = newSchema.id;
                  console.debug('Starting and awaiting putBoardMutation');
                  await putBoardMutation(eonixClient, boardInput.id, boardInput);
               }

               console.debug('awaiting putSchemaMutation');
               await putSchemaProm;

               console.debug('save finished');
               emit('close');
            } finally {
               isSaving.value = false;
            }
         };

         const cancel = () => {
            emit('close');
         };

         return { fieldValues, inputSelection, schemaInputs, inputType, save, cancel, isFormDirty, isFormValid };
      }
   });

   interface FieldValueVm {
      id: number;
      value: string;
      itemType: string;
   }

</script>
