
//Needed to polyfill fetch for apollo client to use
import 'cross-fetch/polyfill';

import { boardQuery, EonixClient, UUID } from '@eonix-io/client';

const eonixToken = process.env['EONIX_TOKEN'];
if (!eonixToken) { throw new Error('Missing EONIX_TOKEN config'); }

const eonixHost = process.env['EONIX_HOST'];
if (!eonixHost) { throw new Error('Missing EONIX_HOST config'); }

const eonixBoardId = process.env['EONIX_BOARD_ID'] as UUID | undefined;
if (!eonixBoardId) { throw new Error('Missing EONIX_BOARD_ID config'); }

const eonixClient = new EonixClient(() => eonixToken, { host: eonixHost });

const board$ = eonixClient.watchQuery(boardQuery(eonixBoardId));

board$.subscribe(b => {
   console.log('Board', b);
});