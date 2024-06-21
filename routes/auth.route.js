import { adminLogin, loginUser } from "../controller/auth.controller";
import customErrorHandler from "../middleware/customErrorHandler";
import { loginSchema } from "../schema/commonSchema";


export const authRoute = (app) => {
    // done
    app.post('/api/admin-login', loginSchema, customErrorHandler, adminLogin);
    // done
    app.post('/api/user-login', loginUser);
}