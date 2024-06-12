import {
    createGame,
    createMarket,
    getAllGames,
    getAllMarkets,
    updateGame,
    updateMarket,
    createRunner,
    createRate,
    updateRunner,
    updateRate,
    getAllRunners,
  } from "../controller/game.controller.js";
  import { Authorize } from "../middleware/auth.js";
  import customErrorHandler from "../middleware/customErrorHandler.js";
  import {
    createdGameSchema,
    createdMarketSchema,
    updateGameSchema,
    updateMarketSchema,
    createdRateSchema,
    createdRunnerSchema,
    updateRateSchema,
    updateRunnerSchema,  
  } from "../schema/commonSchema.js";

export const GameRoute = (app) =>{
// done
app.post('/api/create-games', createdGameSchema, customErrorHandler, createGame);
// done
app.get('/api/all-games', customErrorHandler, getAllGames);
// done
app.put('/api/update/game', updateGameSchema, customErrorHandler, updateGame);
// done
app.post('/api/create-markets/:gameId', createdMarketSchema, customErrorHandler, createMarket);
// done
app.get('/api/all-markets/:gameId', customErrorHandler, getAllMarkets);
// done
app.put('/api/update/market', updateMarketSchema, customErrorHandler, updateMarket);
// done
app.post('/api/create-runners/:marketId', createdRunnerSchema, customErrorHandler, createRunner);
// done
app.put('/api/update/runner', updateRunnerSchema, customErrorHandler, updateRunner);

app.get('/api/all-runners/:marketId', customErrorHandler, getAllRunners);
// done
app.post('/api/create-Rate/:runnerId', createdRateSchema, customErrorHandler, createRate);
// done
app.put('/api/update/rate', updateRateSchema, customErrorHandler,  updateRate);

}