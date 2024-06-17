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
  createUser,
  userUpdate,
} from '../controller/user.controller.js';
import { authorize } from '../middleware/auth.js';
import {
  bidHistorySchema,
  bidTypeSchema,
  calculateProfitLossSchema,
  createdUserSchema,
  currentOrderSchema,
  userUpdateSchema,
} from '../schema/commonSchema.js';
import customErrorHandler from '../middleware/customErrorHandler.js';
import { string } from '../constructor/string.js';

export const UserRoute = (app) => {
  // done
  app.post('/api/user-create', createdUserSchema, customErrorHandler, authorize([string.Admin]), createUser);
  // done
  app.put('/api/users-update/:userId', userUpdateSchema, customErrorHandler, authorize([string.Admin]), userUpdate);
  // done
  app.post('/api/user-login', loginUser);
  // done
  app.post('/api/eligibilityCheck/:userId', authorize(['User']), eligibilityCheck);
  // done
  app.post('/api/user/resetpassword', authorize(['User']), resetPassword);
  // done
  app.get('/api/user-games', userGame);
  // done
  app.get('/api/user-markets/:gameId', authorize(['User']), userMarket);
  // done
  app.get('/api/user-runners/:marketId', authorize(['User']), userRunners);
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
  app.get('/api/user/view-wallet/:userId', authorize(['User']), getUserWallet);
  // done
  app.get('/api/transactionDetails/:userId', authorize(['User']), transactionDetails);
  // done
  app.post('/api/user-filter-marketData/:marketId', filterMarketData);
  // Not getting correct balance but exposure is done
  app.post('/api/user-bidding', bidTypeSchema, customErrorHandler, authorize(['User']), createBid);
  // done
  app.get(
    '/api/user-betHistory/:marketId',
    bidHistorySchema,
    customErrorHandler,
    authorize(['User']),
    getUserBetHistory,
  );
  // done
  app.get(
    '/api/user-currentOrderHistory/:marketId',
    currentOrderSchema,
    customErrorHandler,
    authorize(['User']),
    currentOrderHistory,
  );
  // done
  app.get('/api/profit_loss', calculateProfitLossSchema, customErrorHandler, authorize(['User']), calculateProfitLoss);
  // done
  app.get(
    '/api/profit_loss_market/:gameId',
    calculateProfitLossSchema,
    customErrorHandler,
    authorize(['User']),
    marketProfitLoss,
  );
  // done
  app.get(
    '/api/profit_loss_runner/:marketId',
    calculateProfitLossSchema,
    customErrorHandler,
    authorize(['User']),
    runnerProfitLoss,
  );
};
