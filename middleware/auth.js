import jwt from 'jsonwebtoken';
import { database } from '../controller/database.controller.js';
import { apiResponseErr } from './serverError.js';

export const Authorize = (roles) => {
  return async (req, res, next) => {
    try {
      const authToken = req?.headers?.authorization;

      if (!authToken) {
        return res.status(401).send(apiResponseErr(null, false, 401, 'Unauthorized access'));
      }

      const tokenParts = authToken.split(' ');
      if (tokenParts.length !== 2 || !(tokenParts[0] === 'Bearer' && tokenParts[1])) {
        return res.status(401).send(apiResponseErr(null, false, 401, 'Unauthorized access'));
      }

      const user = jwt.verify(tokenParts[1], process.env.JWT_SECRET_KEY);

      if (!user) {
        return res.status(401).send(apiResponseErr(null, false, 401, 'Unauthorized access'));
      }

      let existingUser;
      if (roles.includes('Admin')) {
        [existingUser] = await database.execute('SELECT * FROM Admin WHERE adminId = ?', [user.adminId]);
      }

      if (roles.includes('User')) {
        [existingUser] = await database.execute('SELECT * FROM User WHERE id = ?', [user.id]);
      }

      if (!existingUser) {
        return res.status(401).send(apiResponseErr(null, false, 401, 'Unauthorized access'));
      }

      const rolesArray = existingUser[0].roles.replace(/['"]+/g, '').split(',');

      if (roles && roles.length > 0) {
        let userHasRequiredRole = false;

        roles.forEach((role) => {
          if (rolesArray.includes(role)) {
            userHasRequiredRole = true;
          }
        });

        if (!userHasRequiredRole) {
          return res.status(401).send({ code: 401, message: 'Unauthorized access' });
        }
      }

      req.user = existingUser[0];
      next();
    } catch (err) {
      console.error('Authorization Error:', err.message);
      return res.status(401).send(apiResponseErr(null, false, 401, 'Unauthorized access'));
    }
  };
};
