import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const query = async (sql, values) => {
  const [rows, fields] = await pool.execute(sql, values);
  return rows;
};

export const Authorize = (roles) => {
  return async (req, res, next) => {
    try {
      const authToken = req.headers.authorization;
      if (!authToken) {
        return res.status(401).send({ code: 401, message: 'Invalid login attempt (1)' });
      }

      const tokenParts = authToken.split(' ');
      if (!(tokenParts.length === 2 && tokenParts[0] === 'Bearer' && tokenParts[1])) {
        return res.status(401).send({ code: 401, message: 'Invalid login attempt (2)' });
      }

      const user = jwt.verify(tokenParts[1], process.env.JWT_SECRET_KEY);

      if (!user) {
        return res.status(401).send({ code: 401, message: 'Invalid login attempt (3)' });
      }

      const [existingUser] = await query('SELECT * FROM Admin WHERE id = ?', [user.id]);

      if (!existingUser || existingUser.length === 0 || !existingUser.roles) {
        return res.status(401).send({ code: 401, message: 'Invalid login attempt (4)' });
      }

      const rolesArray = existingUser.roles.replace(/['"]+/g, '').split(',');

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

      req.user = existingUser;
      next();
    } catch (err) {
      console.error('Authorization Error:', err.message);
      return res.status(401).send({ code: 401, message: 'Unauthorized access' });
    }
  };
};
