
//Needed to polyfill fetch for apollo client to use
import 'cross-fetch/polyfill';

import { boardQuery, EonixClient, schemaForBoardQuery, UUID } from '@eonix-io/client';
import { toPromise } from './services/toPromise';

const eonixToken = process.env['EONIX_TOKEN'];
if (!eonixToken) { throw new Error('Missing EONIX_TOKEN config'); }

const eonixHost = process.env['EONIX_HOST'];
if (!eonixHost) { throw new Error('Missing EONIX_HOST config'); }

const eonixBoardId = process.env['EONIX_BOARD_ID'] as UUID | undefined;
if (!eonixBoardId) { throw new Error('Missing EONIX_BOARD_ID config'); }

const eonixClient = new EonixClient(() => eonixToken, { host: eonixHost });

(async () => {

   console.log('Loading eonix board and schema');
   const board = (await toPromise(eonixClient.watchQuery(boardQuery(eonixBoardId)))).board;
   const schema = (await toPromise(eonixClient.watchQuery(schemaForBoardQuery(eonixBoardId)))).schemaForBoard;

   console.log('Board', JSON.stringify(board, null, 3));
   console.log('Schema', JSON.stringify(schema, null, 3));

   process.exit();
})();