import { string } from "../constructor/string.js";
import { getLotteryGame, getUser, getUserPurchases, purchaseLotteryTicket } from "../controller/lotteryGame.controller.js"
import { authorize } from "../middleware/auth.js";

export const lotteryRoute = (app) => {
    app.get("/api/get-lottery-game", getLotteryGame)
    app.get('/api/get-users', getUser);
    app.post("/api/purchase-lottery", authorize([string.User]), purchaseLotteryTicket)
    app.get("/api/user-purchases",authorize([string.User]),getUserPurchases)
}