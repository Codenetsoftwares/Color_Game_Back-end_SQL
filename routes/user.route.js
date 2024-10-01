import {
  eligibilityCheck,
  resetPassword,
  userGame,
  userMarket,
  userRunners,
  getAllGameData,
  filteredGameData,
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
  userMarketData,
  userBetHistoryGames,
  accountStatement,
  getUserBetList,
  getUserCurrentOrderGames,
  activityLog,
} from '../controller/user.controller.js';
import { authorize } from '../middleware/auth.js';
import {
  bidHistorySchema,
  bidTypeSchema,
  calculateProfitLossValidate,
  createUserValidate,
  currentOrderSchema,
  marketProfitLossValidate,
  runnerProfitLossValidate,
  validateUserResetPassword,
} from '../schema/commonSchema.js';
import customErrorHandler from '../middleware/customErrorHandler.js';
import { string } from '../constructor/string.js';
import { authenticateSuperAdmin } from '../middleware/whiteLabelAuth.js';

export const UserRoute = (app) => {
  // done
  app.post('/api/user-create', createUserValidate, customErrorHandler, authenticateSuperAdmin, createUser);
  // done
  app.put('/api/users-update/:userId', authorize([string.Admin]), userUpdate);

  // done
  app.post('/api/eligibilityCheck/:userId', authorize([string.User]), eligibilityCheck);
  // done
  app.post(
    '/api/user/resetpassword',
    validateUserResetPassword,
    customErrorHandler,
    authorize([string.User]),
    resetPassword,
  );
  // done
  app.get('/api/user-games', customErrorHandler, userGame);
  // done
  app.get('/api/user-markets/:gameId', customErrorHandler, authorize([string.User]), userMarket);
  // done
  app.get('/api/user-runners/:marketId', customErrorHandler, authorize([string.User]), userRunners);
  // done
  app.get('/api/user-all-gameData', customErrorHandler, getAllGameData);
  // done
  app.get('/api/user-filter-gameData/:gameId', customErrorHandler, filteredGameData);
  // done
  app.get('/api/user/gif', userGif);
  // done
  app.get('/api/user/view-wallet/:userId', authorize([string.User]), getUserWallet);
  // done
  app.get('/api/transactionDetails/:userId', authorize([string.User]), transactionDetails);
  // done
  app.post('/api/user-filter-marketData/:marketId', filterMarketData);

  app.post('/api/user-bidding', bidTypeSchema, customErrorHandler, authorize([string.User]), createBid);
  // done
  app.get(
    '/api/user-betHistory/:gameId',
    bidHistorySchema,
    customErrorHandler,
    authorize([string.User]),
    getUserBetHistory,
  );
  // done
  app.get(
    '/api/user-currentOrderHistory/:gameId',
    currentOrderSchema,
    customErrorHandler,
    authorize([string.User]),
    currentOrderHistory,
  );
  // done
  app.get(
    '/api/profit_loss',
    authorize([string.User]),
    calculateProfitLoss,
  );
  // done
  app.get(
    '/api/profit_loss_market/:gameId',
    marketProfitLossValidate,
    customErrorHandler,
    authorize([string.User]),
    marketProfitLoss,
  );
  // done
  app.get(
    '/api/profit_loss_runner/:marketId',
    runnerProfitLossValidate,
    customErrorHandler,
    authorize([string.User]),
    runnerProfitLoss,
  );

  app.get('/api/user-market-data', customErrorHandler, authorize([string.User]), userMarketData);

  app.get('/api/user-betHistory-games', userBetHistoryGames);

  app.get('/api/user-account-statement', authorize([string.User]), accountStatement)

  app.get('/api/get-user-betList/:runnerId', authorize([string.User]), getUserBetList)

  app.get('/api/user-currentOrder-games', authorize([string.User]), getUserCurrentOrderGames)

  app.get('/api/user-activitylog', authorize([string.User]), activityLog)

};
