import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { string } from '../constructor/string.js';
import { apiResponseErr } from '../middleware/serverError.js';
import { statusCode } from '../helper/statusCodes.js';
dotenv.config();

export const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return apiResponseErr(null, false, statusCode.unauthorize, 'Access denied. No token provided.', res);
  }
  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return apiResponseErr(null, false, statusCode.unauthorize, 'Unauthorized Access', res);
    }

    const role = string.Admin;
    console.log('role', role);
    const adminRole = decoded.roles;
    console.log('userRole', adminRole);

    if (!role.includes(adminRole)) {
      return apiResponseErr(null, false, statusCode.unauthorize, 'Unauthorized Access', res);
    }

    req.admin = decoded;
    next();
  });
};
