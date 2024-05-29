import {
  loginUser,
  eligibilityCheck,
  resetPassword,
  userGame,
  userMarket,
  userRunners,
  getAllGameData,
  filteredGameData,
  getAnnouncementUser,
  getAnnouncementTypes,
  userGif,
  getUserWallet,
  transactionDetails,
  createBid,
  filterMarketData,
  getUserBetHistory,
  currentOrderHistory,
  calculateProfitLoss,
  marketProfitLoss,
  runnerProfitLoss,
  userMarketData,
} from '../controller/user.controller.js';
import { Authorize } from '../middleware/auth.js';
import {
  bidHistorySchema,
  bidTypeSchema,
  calculateProfitLossSchema,
  currentOrderSchema,
  validateMarketData,
} from '../schema/commonSchema.js';
import customErrorHandler from '../middleware/customErrorHandler.js';

export const UserRoute = (app) => {
  // done
  app.post('/api/user-login', loginUser);
  // done
  app.post('/api/eligibilityCheck/:userId', Authorize(['User']), eligibilityCheck);
  // done
  app.post('/api/user/resetpassword', Authorize(['User']), resetPassword);
  // done
  app.get('/api/user-games', userGame);
  // done
  app.get('/api/user-markets/:gameId', Authorize(['User']), userMarket);
  // done
  app.get('/api/user-runners/:marketId', Authorize(['User']), userRunners);
  // done
  app.get('/api/user-all-gameData', getAllGameData);
  // done
  app.get('/api/user-filter-gameData/:gameId', filteredGameData);
  // done
  app.get('/api/user/announcements/:announceId', getAnnouncementUser);
  // done
  app.get('/api/user/game-typeOfAnnouncement', getAnnouncementTypes);
  // done
  app.get('/api/user/gif', userGif);
  // done
  app.get('/api/user/view-wallet/:userId', Authorize(['User']), getUserWallet);
  // done
  app.get('/api/transactionDetails/:userId', Authorize(['User']), transactionDetails);
  // done
  app.post('/api/user-filter-marketData/:marketId', validateMarketData, customErrorHandler, filterMarketData);
  // done
  app.post('/api/user-bidding', bidTypeSchema, customErrorHandler, Authorize(['User']), createBid);
  // done
  app.get(
    '/api/user-betHistory/:marketId',
    bidHistorySchema,
    customErrorHandler,
    Authorize(['User']),
    getUserBetHistory,
  );
  // done
  app.get(
    '/api/user-currentOrderHistory/:marketId',
    currentOrderSchema,
    customErrorHandler,
    Authorize(['User']),
    currentOrderHistory,
  );
  // done
  app.get('/api/profit_loss', calculateProfitLossSchema, customErrorHandler, Authorize(['User']), calculateProfitLoss);
  // done
  app.get(
    '/api/profit_loss_market/:gameId',
    calculateProfitLossSchema,
    customErrorHandler,
    Authorize(['User']),
    marketProfitLoss,
  );
  // done
  app.get(
    '/api/profit_loss_runner/:marketId',
    calculateProfitLossSchema,
    customErrorHandler,
    Authorize(['User']),
    runnerProfitLoss,
  );
  // done
  app.get('/api/user-market-data', customErrorHandler, Authorize(['User']), userMarketData);
};
