
//Needed to polyfill fetch for apollo client to use
import 'cross-fetch/polyfill';

import { boardQuery, EonixClient, UUID } from '@eonix-io/client';
import { IBoardAppData } from './IAppData';
import * as AzureDevOps from 'azure-devops-node-api';

const eonixToken = process.env['EONIX_TOKEN'];
if (!eonixToken) { throw new Error('Missing EONIX_TOKEN config'); }

const eonixHost = process.env['EONIX_HOST'];
if (!eonixHost) { throw new Error('Missing EONIX_HOST config'); }

const eonixBoardId = process.env['EONIX_BOARD_ID'] as UUID | undefined;
if (!eonixBoardId) { throw new Error('Missing EONIX_BOARD_ID config'); }

const eonixClient = new EonixClient(() => eonixToken, { host: eonixHost });

(async () => {

   console.log('Loading eonix board and schema');
   const board = (await eonixClient.watchQuery(boardQuery<IBoardAppData>(eonixBoardId)).asPromise()).board;

   const boardAdoPlugin = board?.appData?.pluginAdo;
   if (!boardAdoPlugin) { throw new Error('Missing board.appData.adoPlugin'); }

   const adoAuthHandler = AzureDevOps.getPersonalAccessTokenHandler(boardAdoPlugin.token);
   const adoConnection = new AzureDevOps.WebApi(boardAdoPlugin.orgUrl, adoAuthHandler);
   const witClient = await adoConnection.getWorkItemTrackingApi();

   const wiqlResult = await witClient.queryByWiql({ query: 'Select [Id] From WorkItems order by [System.CreatedDate] desc' }, { projectId: boardAdoPlugin.project });

   const allIds = wiqlResult.workItems?.map(wi => wi.id);

   console.log('Got work item ids', allIds?.length);

   process.exit();
})();