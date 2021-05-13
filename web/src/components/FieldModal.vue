
<template>
   <ex-modal @close="$emit('close')">
      <div v-if="field">
         <h1>{{ field.name }}</h1>

         <div class="form-floating">
            <select class="form-control" placeholder="*" v-model="inputSelection">
               <option value="ignore">Ignore</option>
               <option v-for="i of schemaInputs" :key="i.id" :value="i.id">
                  {{ i.name }}
               </option>
               <option value="new">New</option>
            </select>
            <label>Eonix Input</label>
         </div>

         <div v-if="inputSelection === 'new'" class="form-floating mt-3">
            <select class="form-control" placeholder="*" v-model="inputType">
               <option :value="null" />
               <option
                  v-for="i of inputTypeVms"
                  :key="i.type"
                  :value="i.type"
                  :disabled="i.disabled"
               >
                  {{ i.text }}
               </option>
            </select>
            <label>Eonix Input</label>
         </div>

         <div class="mt-4" v-if="inputType === 'select'">
            <h3>Select values</h3>
            <div class="list-group select-list overflow-auto" v-if="distinctValues">
               <div class="list-group-item" v-for="value of distinctValues" :key="value">
                  {{ value || "[Empty]" }}
               </div>
            </div>
         </div>

         <div class="row mt-5" v-if="isFormDirty">
            <div class="col">
               <button
                  id="p-task-save"
                  class="w-100 btn btn-primary"
                  :class="{ 'btn-outline-secondary': !isFormDirty }"
                  :disabled="!isFormValid || !isFormDirty"
                  @click="save"
               >
                  Save
               </button>
            </div>
            <div class="col">
               <button class="w-100 btn btn-secondary" @click="cancel">
                  {{ isFormDirty ? "Cancel" : "Close" }}
               </button>
            </div>
         </div>

         <h3 class="mt-4">
            Example values
         </h3>
         <div class="list-group">
            <div class="list-group-item" v-for="v of exampleValues" :key="v.id">
               <div class="row">
                  <a href="#" target="_blank" class="col-2 mb-0"> {{ v.itemType }} {{ v.id }} </a>
                  <span class="col mb-0">{{ v.value }}</span>
               </div>
            </div>
         </div>
      </div>
   </ex-modal>
</template>

<script lang="ts">

   import { AdoClient } from '@/services';
   import { useQueryRef } from '@/services/useQueryRef';
   import { boardQuery, boardToBoardInput, deepClone, EonixClient, IInputBase, InputType, ISchema, ISelectInput, isTextInput, ITextInput, ITextOptions, putBoardMutation, putSchemaMutation, schemaForBoardQuery, schemaToSchemaInput, TextType, TextValueOptionsType, uuid, UUID, uuidEmpty } from '@eonix-io/client';
   import type { WorkItem, WorkItemField } from 'azure-devops-extension-api/WorkItemTracking';
   import { computed, defineComponent, inject, ref, Ref, toRef, watch } from 'vue';
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

         const distinctValues = useDistinctValues(workItems, computed(() => props.field.referenceName));

         const suggestedType = useSuggestedType(workItems, distinctValues);

         const exampleValues = useExampleValues(workItems, toRef(props, 'field'));

         const inputType = ref<InputType | null>(null);

         watch(inputSelection, selection => {
            if (selection === 'new') {
               inputType.value = suggestedType.value;
               return;
            }

            inputType.value = null;
         });

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

               const id = originalInput.value?.id ?? uuid();
               const name = originalInput.value?.name ?? props.field.name;

               switch (inputType.value!) {
                  case InputType.Text: {

                     const options: ITextOptions = isTextInput(originalInput.value) ? originalInput.value.options : {
                        type: TextType.Text,
                        maxLength: null
                     };

                     inputBase = {
                        type: InputType.Text,
                        id,
                        name,
                        appData: null,
                        options
                     } as ITextInput;

                     break;
                  }
                  case InputType.Select: {

                     inputBase = {
                        type: InputType.Select,
                        id,
                        name,
                        appData: null,
                        options: {
                           optionsType: TextValueOptionsType.Static,
                           options: distinctValues.value?.map(v => ({ value: v, text: v })) ?? [],
                           functionId: null
                        }
                     } as ISelectInput;

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

         const inputTypeVms = useInputTypes(suggestedType, distinctValues);

         return { exampleValues, inputSelection, schemaInputs, inputType, save, cancel, isFormDirty, isFormValid, suggestedType, distinctValues, inputTypeVms };
      }
   });

   function useDistinctValues(workItems: Ref<WorkItem[]>, referenceName: Ref<string>): Ref<string[] | null> {
      return computed(() => {
         if (!workItems.value.length) { return null; }
         //Fasted distinct method based on https://medium.com/@jakubsynowiec/unique-array-values-in-javascript-7c932682766c
         const seen = new Set();
         const distinct: string[] = [];
         for (let i = 0; i < workItems.value.length; i++) {
            const value = workItems.value[i].fields[referenceName.value] ?? '';
            if (!seen.has(value)) {
               seen.add(value);
               distinct.push(value);
            }
         }
         return distinct.sort((a, b) => a.localeCompare(b));
      });
   }

   function useSuggestedType(workItems: Ref<WorkItem[]>, distinctValues: Ref<string[] | null>) {
      return computed(() => {

         if (!workItems.value) { return InputType.Text; }

         if (!distinctValues.value) { return InputType.Text; }

         //If the number of distinct values is < 25% of the total values then suggest a select
         if (workItems.value.length > 50 && distinctValues.value.length < 50 && distinctValues.value.length < (workItems.value.length * .25)) { return InputType.Select; }

         return InputType.Text;

      });
   }

   function useInputTypes(suggestedType: Ref<InputType>, distinctValues: Ref<string[] | null>): Ref<IInputTypeVm[]> {
      return computed(() => {
         const vm = Object.entries(InputType).map(e => {

            let text = e[0] + (e[1] === suggestedType.value ? ' (Recommended)' : '');
            let disabled = false;

            switch (e[1]) {
               case InputType.Select: {
                  if ((distinctValues.value?.length ?? 0) > 50) {
                     disabled = true;
                     text += ' (Too many possibilities)';
                  }
                  break;
               }
               case InputType.Boolean: {
                  if ((distinctValues.value?.length ?? 0) > 2) {
                     disabled = true;
                     text += ' (Too many possibilities)';
                  }
                  break;
               }
            }

            return {
               type: e[1],
               text,
               disabled
            };
         });
         return vm.sort((a, b) => a.type.localeCompare(b.type));
      });
   }

   function useExampleValues(workItems: Ref<WorkItem[]>, workItemField: Ref<WorkItemField>): Ref<IFieldValueVm[]> {
      return computed(() => {
         const values: IFieldValueVm[] = [];

         for (const wi of workItems.value) {
            let v = wi.fields[workItemField.value.referenceName];
            if (!v) { continue; }

            if (workItemField.value.isIdentity) {
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
   }

   interface IFieldValueVm {
      id: number;
      value: string;
      itemType: string;
   }

   interface IInputTypeVm {
      type: InputType;
      text: string;
      disabled: boolean;
   }

</script>

<style lang="postcss" scoped>
   .select-list {
      max-height: 300px;
   }
</style>