import { string } from "../constructor/string.js";
import {
  getResult,
  getTicketRange,
  purchaseHistory,
  purchaseLottery,
  searchTicket,
} from "../controller/lotteryGame.controller.js";
import { authorize } from "../middleware/auth.js";
import customErrorHandler from "../middleware/customErrorHandler.js";
import { searchTicketValidation } from "../schema/commonSchema.js";

export const lotteryRoute = (app) => {

  app.post("/api/search-ticket", searchTicketValidation, customErrorHandler, authorize([string.User]), searchTicket);

  app.post("/api/purchase-lottery", authorize([string.User]), purchaseLottery);

  app.post('/api/purchase-history', authorize([string.User]), purchaseHistory);

  app.get('/api/get-range', getTicketRange);

  app.get("/api/prize-results", authorize([string.User]), getResult);
};
