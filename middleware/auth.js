import jwt from 'jsonwebtoken';
import { database } from '../controller/database.controller.js';

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

            const [existingUser] = await database.execute('SELECT * FROM Admin WHERE userName = ?', [user.userName]);

            if (!existingUser || existingUser.length === 0 || !existingUser[0].roles) {
                return res.status(401).send({ code: 401, message: 'Invalid login attempt (4)' });
            }

            const rolesArray = JSON.parse(existingUser[0].roles);

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
            return res.status(401).send({ code: 401, message: 'Unauthorized access' });
        }
    };
};
