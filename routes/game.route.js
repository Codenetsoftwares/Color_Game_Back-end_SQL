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

app.post('/api/create-games', createdGameSchema, customErrorHandler, Authorize(['Admin']), createGame);

app.get('/api/All-Games', customErrorHandler, Authorize(['Admin']), getAllGames);

app.put('/api/update/game', updateGameSchema, customErrorHandler, Authorize(['Admin']), updateGame);

app.post('/api/create-markets/:gameId', createdMarketSchema, customErrorHandler, Authorize(['Admin']), createMarket);

app.get('/api/All-Markets/:gameId', customErrorHandler, Authorize(['Admin']), getAllMarkets);

app.put('/api/update/market', updateMarketSchema, customErrorHandler, Authorize(['Admin']), updateMarket);

app.post('/api/create-runners/:marketId', createdRunnerSchema, customErrorHandler, Authorize(['Admin']), createRunner);

app.put('/api/update/runner', updateRunnerSchema, customErrorHandler, Authorize(['Admin']), updateRunner);

app.get('/api/All-Runners/:marketId', customErrorHandler, Authorize(['Admin']), getAllRunners);

app.post('/api/create-Rate/:runnerId', createdRateSchema, customErrorHandler, Authorize(['Admin']), createRate);

app.put('/api/update/rate', updateRateSchema, customErrorHandler, Authorize(['Admin']), updateRate);


}