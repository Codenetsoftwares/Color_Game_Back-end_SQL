import { calculateExternalProfitLoss, getExternalUserBetHistory, marketExternalProfitLoss, runnerExternalProfitLoss } from "../controller/externalApis.controller.js";
import customErrorHandler from "../middleware/customErrorHandler.js";
import { betHistorySchema, calculateProfitLossSchema, marketProfitLossSchema, runnerProfitLossSchema } from "../schema/commonSchema.js";

export const externalApisRoute = (app) => {
    app.get('/api/external-user-betHistory/:userName/:gameId', betHistorySchema, customErrorHandler, getExternalUserBetHistory);

    app.get('/api/external-profit_loss/:userName', calculateProfitLossSchema, customErrorHandler, calculateExternalProfitLoss);

    app.get('/api/external-profit_loss_market/:userName/:gameId', marketProfitLossSchema, customErrorHandler, marketExternalProfitLoss);

    app.get('/api/external-profit_loss_runner/:userName/:marketId', runnerProfitLossSchema, customErrorHandler, runnerExternalProfitLoss);
}