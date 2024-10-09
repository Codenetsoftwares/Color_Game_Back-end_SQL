import {
  calculateExternalProfitLoss,
  liveMarketBet,
  getExternalUserBetHistory,
  marketExternalProfitLoss,
  runnerExternalProfitLoss,
  getLiveBetGames,
  getExternalUserBetList,
} from '../controller/externalApis.controller.js';
import { currentOrderHistory } from '../controller/user.controller.js';
import customErrorHandler from '../middleware/customErrorHandler.js';
import { authenticateSuperAdmin } from '../middleware/whiteLabelAuth.js';
import {
  betHistorySchema,
  calculateProfitLossSchema,
  marketProfitLossSchema,
  runnerProfitLossSchema,
} from '../schema/commonSchema.js';

export const externalApisRoute = (app) => {
  app.get(
    '/api/external-user-betHistory/:userName/:gameId',
    betHistorySchema,
    customErrorHandler,
    authenticateSuperAdmin,
    getExternalUserBetHistory,
  );

  app.get(
    '/api/external-profit_loss/:userName',
    calculateProfitLossSchema,
    customErrorHandler,
    authenticateSuperAdmin,
    calculateExternalProfitLoss,
  );

  app.get(
    '/api/external-profit_loss_market/:userName/:gameId',
    marketProfitLossSchema,
    customErrorHandler,
    authenticateSuperAdmin,
    marketExternalProfitLoss,
  );

  app.get(
    '/api/external-profit_loss_runner/:userName/:marketId',
    runnerProfitLossSchema,
    customErrorHandler,
    authenticateSuperAdmin,
    runnerExternalProfitLoss,
  );

  app.get('/api/user-external-liveBet/:marketId/:userName', authenticateSuperAdmin, liveMarketBet);

  app.get('/api/user-external-liveGamesBet', authenticateSuperAdmin, getLiveBetGames);

  app.get('/api/user-external-betList/:userName/:runnerId', getExternalUserBetList);
};
