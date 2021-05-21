import 'cross-fetch/polyfill';
import { boardQuery, IBoard, ISchema, ITask, schemaForBoardQuery, tasksForBoardQuery, UUID } from '@eonix-io/client';
import { IBoardAppData, IInputAppData, ITaskAppData } from '../../common/IAppData';
import { loadWorkItems } from './services/loadWorkItems';
import { createEonixClient } from './services/createEonixClient';
import { TaskProcessor } from './services/TaskProcessor';

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

   const boardAdoPlugin = board?.appData?.pluginAdo;
   if (!boardAdoPlugin) { throw new Error('Missing board.appData.adoPlugin'); }

   const taskProcessor = new TaskProcessor(eonixClient, eonixBoardId, boardAdoPlugin.token, schema, tasks);

   console.log('Starting work item loader');
   const fields = schema.inputs.map(i => i.appData?.pluginAdo?.referenceName).filter(n => n) as string[];
   let processedWorkItems = 0;
   await loadWorkItems(boardAdoPlugin, fields, async wis => {
      processedWorkItems += wis.length;
      console.log(`Received batch of ${wis.length} work item. Total ${processedWorkItems}`);
      taskProcessor.QueueWorkItems(wis);
   });

   console.log('Work Item loading done. Waiting for update queue to flush');
   const tasksUpdate = await taskProcessor.flushQueue();

   console.log(`Sync finished. Updated ${tasksUpdate} tasks.`);

   process.exit();
})();