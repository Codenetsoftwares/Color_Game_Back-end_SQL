import { Authorize } from '../middleware/auth.js';
import dotenv from 'dotenv';
import customErrorHandler from '../middleware/customErrorHandler.js';
import {
  createAdmin,
  createUser,
  checkMarketStatus,
  deposit,
  sendBalance,
  getAllUsers,
  userUpdate,
  deleteGame,
  deleteMarket,
  deleteRunner,
  generateAccessToken,
  afterWining,
} from '../controller/admin.controller.js';
import {
  createdUserSchema,
  depositSchema,
  loginSchema,
  sendBalanceSchema,
  gameIdValidate,
  winningSchema,
  userUpdateSchema,
  validateMarketId,
  validateDeleteRunner,
  suspendedMarketSchema,
} from '../schema/commonSchema.js';

dotenv.config();

export const AdminRoute = (app) => {
  // done
  app.post('/api/admin-create', customErrorHandler, createAdmin);
  // done
  app.post('/api/admin-login', loginSchema, customErrorHandler, generateAccessToken);
  // done
  app.post('/api/user-create', createdUserSchema, customErrorHandler, Authorize(['Admin']), createUser);
  // done
  app.post('/api/update-market-status/:marketId', suspendedMarketSchema, customErrorHandler, checkMarketStatus);
  // done
  app.get('/api/All-User', customErrorHandler, getAllUsers);
  // done
  app.post('/api/deposit-amount', depositSchema, customErrorHandler, Authorize(['Admin']), deposit);
  // done
  app.post('/api/sendBalance-user', sendBalanceSchema, customErrorHandler, Authorize(['Admin']), sendBalance);
  // done
  app.put('/api/users-update/:userId', userUpdateSchema, customErrorHandler, Authorize(['Admin']), userUpdate);
  // done
  app.delete('/api/game-delete/:gameId', gameIdValidate, customErrorHandler, Authorize(['Admin']), deleteGame);
  // done
  app.delete('/api/market-delete/:marketId', validateMarketId, customErrorHandler, Authorize(['Admin']), deleteMarket);
  // done
  app.delete(
    '/api/runner-delete/:runnerId',
    validateDeleteRunner,
    customErrorHandler,
    Authorize(['Admin']),
    deleteRunner,
  );

  app.post('/api/afterWining', winningSchema, customErrorHandler, Authorize(['Admin']), afterWining);
};
