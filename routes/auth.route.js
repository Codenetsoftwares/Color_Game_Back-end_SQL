import { adminLogin, loginUser, resetPassword, trashUser, restoreTrashUser } from '../controller/auth.controller.js';
import customErrorHandler from '../middleware/customErrorHandler.js';
import { loginSchema, resetPasswordSchema, trashUserSchema } from '../schema/commonSchema.js';

export const authRoute = (app) => {
  // done
  app.post('/api/admin-login', loginSchema, customErrorHandler, adminLogin);
  // done
  app.post('/api/user-login', loginUser);
  // done
  app.post('/api/reset-password', resetPasswordSchema, customErrorHandler, resetPassword);
  // done
  app.post('/api/extrernal/trash-user', trashUserSchema, customErrorHandler, trashUser);
  // done
  app.post('/api/extrernal/restore-trash-user', trashUserSchema, customErrorHandler, restoreTrashUser);
};
