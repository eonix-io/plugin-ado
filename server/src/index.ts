
//Needed to polyfill fetch for apollo client to use
import 'cross-fetch/polyfill';

import { boardQuery, IBoard, ISchema, ITask, schemaForBoardQuery, tasksForBoardQuery, UUID } from '@eonix-io/client';
import { IBoardAppData, IInputAppData } from '../../common/IAppData';
import * as AzureDevOps from 'azure-devops-node-api';
import { loadWorkItems } from './services/loadWorkItems';
import { createEonixClient } from './services/createEonixClient';
import { IInputMapping } from './IInputMapping';
import { getWorkItemTaskUpdate } from './services/getWorkItemTaskUpdate';

const eonixClient = createEonixClient();

const eonixBoardId = process.env['EONIX_BOARD_ID'] as UUID | undefined;
if (!eonixBoardId) { throw new Error('Missing EONIX_BOARD_ID config'); }

(async () => {

   console.log('Loading eonix board, schema and tasks');
   const [board, schema, tasks] = await Promise.all([
      eonixClient.watchQuery(boardQuery<IBoardAppData>(eonixBoardId)).asPromise(),
      eonixClient.watchQuery(schemaForBoardQuery<any, IInputAppData>(eonixBoardId)).asPromise(),
      eonixClient.watchQuery(tasksForBoardQuery(eonixBoardId)).asPromise()
   ]).then(results => {
      return [results[0].board, results[1].schemaForBoard, results[2].tasksForBoard] as [IBoard<IBoardAppData>, ISchema<any, IInputAppData>, ITask[]];
   });

   const mappedInputs: IInputMapping = Object.fromEntries(schema.inputs.filter(i => i.appData?.pluginAdo?.referenceName).map(i => {
      return [i.appData!.pluginAdo!.referenceName, i];
   }));

   const boardAdoPlugin = board?.appData?.pluginAdo;
   if (!boardAdoPlugin) { throw new Error('Missing board.appData.adoPlugin'); }

   console.log('Creatinging work item ADO client');
   const adoAuthHandler = AzureDevOps.getPersonalAccessTokenHandler(boardAdoPlugin.token);
   const adoConnection = new AzureDevOps.WebApi(boardAdoPlugin.orgUrl, adoAuthHandler);
   const witClient = await adoConnection.getWorkItemTrackingApi();

   console.log('Getting work item ids');
   const wiqlResult = await witClient.queryByWiql({ query: 'Select [Id] From WorkItems order by [System.CreatedDate] desc' }, { projectId: boardAdoPlugin.project });

   const allIds = wiqlResult.workItems?.map(wi => wi.id!) ?? [];
   console.log('Got work item ids', allIds?.length);

   console.log('Starting work item loader');
   await loadWorkItems(witClient, boardAdoPlugin.project, allIds, async wis => {
      const _updates = wis.map(wi => getWorkItemTaskUpdate(mappedInputs, tasks, wi)).filter(u => u);
   });

   process.exit();
})();