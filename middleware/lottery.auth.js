import jwt from 'jsonwebtoken';
import { string } from '../constructor/string.js';
import { statusCode } from '../helper/statusCodes.js';
import { apiResponseErr } from '../middleware/serverError.js';
import dotenv from 'dotenv';
dotenv.config();

export const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
      return res.status(statusCode.unauthorize).send(apiResponseErr(null, false, statusCode.unauthorize, 'Access denied. No token provided.'));
  }
  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
      if (err) {
          return res.status(statusCode.unauthorize).send(apiResponseErr(null, false, statusCode.unauthorize, 'Unauthorized Access'));
      }

      if (!decoded.role || decoded.role.length === 0) {
          return res.status(statusCode.unauthorize).send(apiResponseErr(null, false, statusCode.unauthorize, 'Invalid token or roles not found.'));
      }

      const userRole = decoded.role;
      if (!string.Admin.includes(userRole)) {
          return res.status(statusCode.unauthorize).send(apiResponseErr(null, false, statusCode.unauthorize, 'Unauthorized Access'));
      }

      req.user = decoded;
      next();
  });
};

