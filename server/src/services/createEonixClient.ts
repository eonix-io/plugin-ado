import { EonixClient } from '@eonix-io/client';

export function createEonixClient(): EonixClient {
   const eonixToken = process.env['EONIX_TOKEN'];
   if (!eonixToken) { throw new Error('Missing EONIX_TOKEN config'); }

   const eonixHost = process.env['EONIX_HOST'];
   if (!eonixHost) { throw new Error('Missing EONIX_HOST config'); }

   const eonixClient = new EonixClient(() => eonixToken, { host: eonixHost });
   return eonixClient;
}