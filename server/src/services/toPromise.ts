import { Observable } from '@eonix-io/client';

export function toPromise<T>(obs: Observable<T>): Promise<T> {
   const prom = new Promise<T>(r => {
      let resolved = false;
      const sub = obs.subscribe(t => {
         if (!resolved) { r(t); }
         resolved = true;
         setTimeout(() => sub.unsubscribe());
      });
   });
   return prom;
}