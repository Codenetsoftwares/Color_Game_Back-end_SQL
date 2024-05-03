import { loginUser, eligibilityCheck, resetPassword, userGame, userMarket, userRunners, getAllGameData, filteredGameData, getAnnouncementUser, getAnnouncementTypes, userGif, getUserWallet, transactionDetails, createBid, filterMarketData, getUserBetHistory, } from '../controller/user.controller.js';
import { Authorize } from "../middleware/auth.js";
import { bidHistorySchema, bidTypeSchema } from '../schema/commonSchema.js';
import customErrorHandler from '../middleware/customErrorHandler.js'

export const UserRoute = (app) => {

  app.post('/api/user-login', loginUser);

  app.post('/api/eligibilityCheck/:userId', Authorize(["User"]), eligibilityCheck);

  app.post('/api/user/resetpassword', Authorize(["User"]), resetPassword);

  app.get('/api/user-games', userGame)

  app.get('/api/user-markets/:gameId', Authorize(['User']), userMarket)

  app.get('/api/user-runners/:marketId', Authorize(['User']), userRunners)

  app.get('/api/user-all-gameData', getAllGameData);

  app.get('/api/user-filter-gameData/:gameId', filteredGameData);

  app.get('/api/user/announcements/:announceId', getAnnouncementUser);

  app.get('/api/user/game-typeOfAnnouncement', getAnnouncementTypes);

  app.get('/api/user/gif', userGif);

  app.get('/api/user/view-wallet/:userId', Authorize(['User']), getUserWallet)

  app.get('/api/transactionDetails/:userId', Authorize(['User']), transactionDetails);
  // 80%
  app.post('/api/user-filter-marketData/:marketId', filterMarketData);
  // testing after done from frontend
  app.post('/api/user-bidding', bidTypeSchema, customErrorHandler, Authorize(['User']), createBid)

  app.get('/api/user-betHistory/:marketId', bidHistorySchema, customErrorHandler, Authorize(['User']), getUserBetHistory)

}
