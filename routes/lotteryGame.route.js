import { string } from "../constructor/string.js";
import { purchaseHistory, purchaseLottery, searchTicket } from "../controller/lotteryGame.controller.js";
import { authorize } from "../middleware/auth.js";

export const lotteryRoute = (app) => {

  app.post("/api/search-ticket", authorize([string.User]), searchTicket);

  app.post("/api/purchase-lottery", authorize([string.User]), purchaseLottery);

  app.post('/api/purchase-history', authorize([string.User]), purchaseHistory);

};
