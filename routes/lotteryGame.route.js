import { string } from "../constructor/string.js";
import {
  getLotteryGame,
  getResult,
  getUser,
  getUserPurchases,
  lotteryAmount,
  purchaseLotteryTicket,
  searchTicketNumber,
} from "../controller/lotteryGame.controller.js";
import { authorize } from "../middleware/auth.js";
import customErrorHandler from "../middleware/customErrorHandler.js";
import {
  validatePurchaseLotteryTicket,
  validateTicketNumber,
} from "../schema/commonSchema.js";

export const lotteryRoute = (app) => {
  app.get("/api/get-lottery-game", getLotteryGame);

  app.get(
    "/api/search-lottery/:ticketNumber",
    validateTicketNumber,
    customErrorHandler,
    authorize([string.User]),
    searchTicketNumber
  );

  app.get("/api/get-users", getUser); //Not use

  app.post(
    "/api/purchase-lottery",
    validatePurchaseLotteryTicket,
    customErrorHandler,
    authorize([string.User]),
    purchaseLotteryTicket
  );

  app.get(
    "/api/user-lotteryAmount/:lotteryId",
    authorize([string.User]),
    lotteryAmount
  );

  app.get("/api/user-purchases", authorize([string.User]), getUserPurchases);

  app.get("/api/user/getResult/:resultId", authorize([string.User]), getResult);
};
