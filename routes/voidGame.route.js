import { string } from "../constructor/string.js";
import { getAllVoidMarkets, voidMarket } from "../controller/voidGame.controller.js";
import { authorize } from "../middleware/auth.js";
import customErrorHandler from "../middleware/customErrorHandler.js";
import { validateVoidGame } from "../schema/commonSchema.js";

export const voidGameRoute = (app) => {
  app.post(
    "/api/void-market",
    validateVoidGame,
    customErrorHandler,
    authorize([string.Admin]),
    voidMarket
  );

  app.get(
    "/api/get-Void-markets",
   // authorize([string.Admin]),
    getAllVoidMarkets
  );

};
