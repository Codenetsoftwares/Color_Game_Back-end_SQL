import { calculateExternalProfitLoss, liveMarketBet, getExternalUserBetHistory, marketExternalProfitLoss, runnerExternalProfitLoss, getLiveBetGames, getExternalUserBetList, liveUserBet, getExternalLotteryP_L } from "../controller/externalApis.controller.js";
import { currentOrderHistory } from "../controller/user.controller.js";
import customErrorHandler from "../middleware/customErrorHandler.js";
import { authenticateSuperAdmin } from "../middleware/whiteLabelAuth.js";
import { betHistorySchema, calculateProfitLossSchema, marketProfitLossSchema, runnerProfitLossSchema, validateGetExternalLotteryP_L, validateGetLiveUserBet, validateMarketId } from "../schema/commonSchema.js";

export const externalApisRoute = (app) => {
    app.get('/api/external-user-betHistory/:userName/:gameId', betHistorySchema, customErrorHandler, authenticateSuperAdmin, getExternalUserBetHistory);

    app.get('/api/external-profit_loss/:userName', calculateProfitLossSchema, customErrorHandler, authenticateSuperAdmin, calculateExternalProfitLoss);

    app.get('/api/external-profit_loss_market/:userName/:gameId', marketProfitLossSchema, customErrorHandler, authenticateSuperAdmin, marketExternalProfitLoss);

    app.get('/api/external-profit_loss_runner/:userName/:marketId', runnerProfitLossSchema, customErrorHandler, authenticateSuperAdmin, runnerExternalProfitLoss);

    app.get('/api/user-external-liveBet/:marketId', authenticateSuperAdmin, liveMarketBet);

    app.get('/api/user-external-liveGamesBet', getLiveBetGames);

    app.get('/api/user-external-betList/:userName/:runnerId', getExternalUserBetList);

    app.get('/api/users-liveBet/:marketId', validateGetLiveUserBet, customErrorHandler, liveUserBet);

    app.get('/api/external-lottery-profit-loss/:userName',validateGetExternalLotteryP_L ,customErrorHandler, getExternalLotteryP_L);

}