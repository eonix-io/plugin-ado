import { Observable } from '@eonix-io/client';
import { onUnmounted, Ref, ref } from 'vue';

export function useQueryRef<T>(obs: Observable<T>, defaultValue: T): Ref<T> {
   const r = ref<T>(defaultValue) as Ref<T>;
   const sub = obs.subscribe(v => r.value = v);
   onUnmounted(() => sub.unsubscribe());
   return r;
}