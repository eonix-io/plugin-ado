
//Needed to polyfill fetch for apollo client to use
import 'cross-fetch/polyfill';

import { boardQuery, IBoard, ISchema, ITask, ITaskInput, putTasksMutation, schemaForBoardQuery, tasksForBoardQuery, UUID } from '@eonix-io/client';
import { IBoardAppData, IInputAppData, ITaskAppData } from '../../common/IAppData';
import * as AzureDevOps from 'azure-devops-node-api';
import { loadWorkItems } from './services/loadWorkItems';
import { createEonixClient } from './services/createEonixClient';
import { IInputMapping } from './IInputMapping';
import { getWorkItemTaskUpdate } from './services/getWorkItemTaskUpdate';
import { ITaskMapping } from './ITaskMapping';

const eonixClient = createEonixClient();

const eonixBoardId = process.env['EONIX_BOARD_ID'] as UUID | undefined;
if (!eonixBoardId) { throw new Error('Missing EONIX_BOARD_ID config'); }

(async () => {

   console.log('Loading eonix board, schema and tasks');
   const [board, schema, tasks] = await Promise.all([
      eonixClient.watchQuery(boardQuery<IBoardAppData>(eonixBoardId)).asPromise(),
      eonixClient.watchQuery(schemaForBoardQuery<any, IInputAppData>(eonixBoardId)).asPromise(),
      eonixClient.watchQuery(tasksForBoardQuery<ITaskAppData>(eonixBoardId)).asPromise()
   ]).then(results => {
      return [results[0].board, results[1].schemaForBoard, results[2].tasksForBoard] as [IBoard<IBoardAppData>, ISchema<any, IInputAppData>, ITask<ITaskAppData>[]];
   });

   const mappedInputs: IInputMapping = Object.fromEntries(schema.inputs.filter(i => i.appData?.pluginAdo?.referenceName).map(i => {
      return [i.appData!.pluginAdo!.referenceName, i];
   }));

   const mappedTasks: ITaskMapping = Object.fromEntries(tasks.filter(t => t.appData?.pluginAdo?.workItemId).map(t => [t.appData!.pluginAdo!.workItemId, t]));

   const boardAdoPlugin = board?.appData?.pluginAdo;
   if (!boardAdoPlugin) { throw new Error('Missing board.appData.adoPlugin'); }

   console.log('Creatinging work item ADO client');
   const adoAuthHandler = AzureDevOps.getPersonalAccessTokenHandler(boardAdoPlugin.token);
   const adoConnection = new AzureDevOps.WebApi(boardAdoPlugin.orgUrl, adoAuthHandler);
   const witClient = await adoConnection.getWorkItemTrackingApi();

   console.log('Getting work item ids');
   const wiqlResult = await witClient.queryByWiql({ query: 'Select [Id] From WorkItems order by [System.CreatedDate] desc' }, { projectId: boardAdoPlugin.project });

   let allIds = wiqlResult.workItems?.map(wi => wi.id!) ?? [];
   allIds = allIds.slice(0, 2);
   console.log('Got work item ids', allIds?.length);

   console.log('Starting work item loader');
   const fields = Object.getOwnPropertyNames(mappedInputs);
   let processedWorkItems = 0;
   const taskUpdates: ITaskInput[] = [];
   await loadWorkItems(witClient, boardAdoPlugin.project, allIds, fields, async wis => {
      const updates = wis.map(wi => getWorkItemTaskUpdate(eonixBoardId, mappedInputs, mappedTasks, wi)).filter(u => u) as ITaskInput[];
      taskUpdates.push(...updates);
      processedWorkItems += wis.length;
      console.log(`Processed ${processedWorkItems} work items resulting in ${taskUpdates.length} tasks to be updated `);
   });

   while (taskUpdates.length) {
      const batch = taskUpdates.splice(0, 50);
      console.log(`Writing batch of ${batch.length} tasks. ${taskUpdates.length} remaining`);
      await putTasksMutation(eonixClient, batch);
   }

   process.exit();
})();