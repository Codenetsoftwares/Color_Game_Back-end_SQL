import { adminLogin, loginUser, resetPassword } from '../controller/auth.controller.js';
import customErrorHandler from '../middleware/customErrorHandler.js';
import { loginSchema } from '../schema/commonSchema.js';

export const authRoute = (app) => {
  // done
  app.post('/api/admin-login', loginSchema, customErrorHandler, adminLogin);
  // done
  app.post('/api/user-login', loginUser);

  app.post('/api/reset-password', customErrorHandler, resetPassword);

};
