import { string } from "../constructor/string.js";
import {
  getResult,
  getTicketRange,
  purchaseHistory,
  purchaseLottery,
  searchTicket,
  updateBalance,
  getMarkets,
  removeExposer,
  getLotteryResults,
  createLotteryP_L,
  getLotteryP_L,
  getLotteryBetHistory,
  dateWiseMarkets,
  getAllMarket,
  getBetHistoryP_L,
} from "../controller/lotteryGame.controller.js";
import { authorize } from "../middleware/auth.js";
import customErrorHandler from "../middleware/customErrorHandler.js";
import { validateCreateLotteryP_L, validateDateWiseMarkets, validateMarketId, validatePurchaseHistory, validatePurchaseLottery, validateRemoveExposer, validateSearchTickets, validateUpdateBalance } from "../schema/commonSchema.js";

export const lotteryRoute = (app) => {

  app.post("/api/search-ticket", validateSearchTickets, customErrorHandler, authorize([string.User]), searchTicket);

  app.post("/api/purchase-lottery/:marketId", validatePurchaseLottery, customErrorHandler, authorize([string.User]), purchaseLottery);

  app.post('/api/purchase-history/:marketId', validatePurchaseHistory, customErrorHandler, authorize([string.User]), purchaseHistory);

  app.get('/api/get-range', getTicketRange);

  app.get("/api/prize-results", authorize([string.User]), getResult);

  app.get('/api/user-getAllMarket', authorize([string.User]), getMarkets)

  app.post("/api/users/update-balance", validateUpdateBalance, customErrorHandler, updateBalance)

  app.post("/api/users/remove-exposer", validateRemoveExposer, customErrorHandler, removeExposer)

  app.get('/api/user-lottery-results/:marketId', validateMarketId, customErrorHandler, getLotteryResults);

  app.post('/api/lottery-profit-loss', validateCreateLotteryP_L, customErrorHandler, createLotteryP_L)

  app.get('/api/lottery-profit-loss', authorize([string.User]), getLotteryP_L);

  app.post('/api/lottery-bet-history', authorize([string.User]), getLotteryBetHistory);

  app.get("/api/user/markets-dateWise", validateDateWiseMarkets, customErrorHandler, authorize([string.User]), dateWiseMarkets);

  app.get('/api/user/getMarkets', authorize([string.User]), getAllMarket)

  app.get('/api/lottery-betHistory-profitLoss', authorize([string.User]), getBetHistoryP_L);

};
