import { string } from "../constructor/string.js";
import {
  dummyData,
  getLotteryGame,
  getResult,
  getUser,
  getUserPurchases,
  lotteryAmount,
  purchaseLotteryTicket,
} from "../controller/lotteryGame.controller.js";
import { authorize } from "../middleware/auth.js";
import customErrorHandler from "../middleware/customErrorHandler.js";
import { validatePurchaseLotteryTicket } from "../schema/commonSchema.js";

export const lotteryRoute = (app) => {
  app.get("/api/get-lottery-game", getLotteryGame);

  app.get("/api/get-users", getUser); //Not use

  app.post(
    "/api/purchase-lottery",
    validatePurchaseLotteryTicket,
    customErrorHandler,
    authorize([string.User]),
    purchaseLotteryTicket
  );

  app.get("/api/user-lotteryAmount/:lotteryId", authorize([string.User]), lotteryAmount);

  app.get("/api/user-purchases", authorize([string.User]), getUserPurchases);

  app.get("/api/user/getResult/:resultId", authorize([string.User]), getResult);

  // dummy- data Api
  app.get("/api/lotteries-dummyData", dummyData);
};
