import { authorize } from '../middleware/auth.js';
import dotenv from 'dotenv';
import customErrorHandler from '../middleware/customErrorHandler.js';
import {
  createAdmin,
  checkMarketStatus,
  deposit,
  sendBalance,
  getAllUsers,
  afterWining,
} from '../controller/admin.controller.js';
import { depositSchema, sendBalanceSchema, winningSchema, suspendedMarketSchema } from '../schema/commonSchema.js';
import { string } from '../constructor/string.js';

dotenv.config();

export const AdminRoute = (app) => {
  // done
  app.post('/api/admin-create', customErrorHandler, authorize([string.Admin]), createAdmin);

  // done
  app.post(
    '/api/update-market-status/:marketId',
    suspendedMarketSchema,
    customErrorHandler,
    authorize([string.Admin]),
    checkMarketStatus,
  );
  // done
  app.get('/api/all-user', customErrorHandler, getAllUsers);
  // done
  app.post('/api/deposit-amount', depositSchema, customErrorHandler, authorize([string.Admin]), deposit);
  // done
  app.post('/api/sendBalance-user', customErrorHandler, sendBalance);

  app.post('/api/afterWining', winningSchema, customErrorHandler, authorize([string.Admin]), afterWining);
};
