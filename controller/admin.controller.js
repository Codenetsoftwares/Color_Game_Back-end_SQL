import { database } from '../controller/database.controller.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { apiResponseErr, apiResponseSuccess, apiResponsePagination } from '../middleware/serverError.js';
import { statusCode } from '../helper/statusCodes.js';
import admins from '../models/admin.model.js';
import { string } from '../constructor/string.js';

dotenv.config();
// done
export const createAdmin = async (req, res) => {
  const { userName, password } = req.body;
  try {
    const existingAdmin = await admins.findOne({ where: { userName } });

    if (existingAdmin) {
      return res.status(statusCode.badRequest).json(apiResponseErr(null, false, statusCode.badRequest, 'Admin already exists'));
    }

    const newAdmin = await admins.create({
      adminId: uuidv4(),
      userName,
      password,  
      roles: string.Admin,
    });

    return res.status(statusCode.create).json(apiResponseSuccess(newAdmin, true, statusCode.create, 'Admin created successfully'));
  } catch (error) {
    return res
      .status(statusCode.internalServerError)
      .json(apiResponseErr(error.data ?? null, false, error.responseCode ?? statusCode.internalServerError, error.errMessage ?? error.message));
  }
};
// done
export const adminLogin = async (req, res) => {
  const { userName, password } = req.body;
  try {
    const existingAdmin = await admins.findOne({ where: { userName } });

    if (!existingAdmin) {
      console.log('Admin not found');
      return res.status(statusCode.badRequest).send(apiResponseErr(null, false, statusCode.badRequest, 'Admin Does Not Exist'));
    }

    const isPasswordValid = await existingAdmin.validPassword(password);

    if (!isPasswordValid) {
      console.log('Invalid password');
      return res.status(statusCode.badRequest).send(apiResponseErr(null, false, statusCode.badRequest, 'Invalid username or password'));
    }

    const accessTokenResponse = {
      id: existingAdmin.id,
      adminId: existingAdmin.adminId,
      userName: existingAdmin.userName,
      UserType: existingAdmin.userType || 'admin',
    };

    const accessToken = jwt.sign(accessTokenResponse, process.env.JWT_SECRET_KEY, {
      expiresIn: '1d',
    });

    return res.status(statusCode.success).send(
      apiResponseSuccess(
        { accessToken, adminId: existingAdmin.adminId, userName: existingAdmin.userName, UserType: existingAdmin.userType || 'admin' },
        true,
        statusCode.success,
        'Admin login successfully'
      )
    );
  } catch (error) {
    console.error('Error in adminLogin:', error.message);
    res
      .status(statusCode.internalServerError)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? statusCode.internalServerError, error.errMessage ?? error.message));
  }
};

export const checkMarketStatus = async (req, res) => {
  const marketId = req.params.marketId;
  const { status } = req.body;

  try {
    const [market] = await database.execute('SELECT * FROM Market WHERE marketId = ?', [marketId]);

    if (!market) {
      return res.status(statusCode.notFound).json(apiResponseErr(null, false, statusCode.notFound, 'Market not found.'));
    }

    const updateMarketQuery = 'UPDATE Market SET isActive = ? WHERE marketId = ?';
    await database.execute(updateMarketQuery, [status, marketId]);

    const statusMessage = status ? 'Market is active.' : 'Market is suspended.';
    res.status(statusCode.success).send(apiResponseSuccess(statusMessage, true, statusCode.success, 'success'));
  } catch (error) {
    res
      .status(statusCode.internalServerError)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? statusCode.internalServerError, error.errMessage ?? error.message));
  }
};
export const getAllUsers = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
    const searchQuery = req.query.search ? req.query.search.toLowerCase() : '';

    const countQuery = `SELECT COUNT(*) AS total FROM User WHERE LOWER(userName) LIKE '%${searchQuery}%'`;
    const [countResult] = await database.execute(countQuery);
    const totalItems = countResult[0].total;

    const totalPages = Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;

    const getUsersQuery = `SELECT * FROM User WHERE LOWER(userName) LIKE '%${searchQuery}%' LIMIT ${offset}, ${pageSize}`;
    const [users] = await database.execute(getUsersQuery);

    if (!users || users.length === 0) {
      throw apiResponseErr(null, false, statusCode.badRequest, 'User not found');
    }

    const paginationData = apiResponsePagination(page, totalPages, totalItems);
    return res.status(statusCode.success).send(apiResponseSuccess(users, true, statusCode.success, paginationData));
  } catch (error) {
    res
      .status(statusCode.internalServerError)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? statusCode.internalServerError, error.errMessage ?? error.message));
  }
};
export const deposit = async (req, res) => {
  try {
    const { adminId, depositAmount } = req.body;
    const existingAdminQuery = 'SELECT * FROM Admin WHERE adminId = ?';
    const [existingAdmin] = await database.execute(existingAdminQuery, [adminId]);

    if (!existingAdmin) {
      return res.status(statusCode.notFound).json(apiResponseErr(null, false, statusCode.notFound, 'Admin Not Found'));
    }

    const parsedDepositAmount = parseFloat(depositAmount);

    const updateAdminQuery = 'UPDATE Admin SET balance = COALESCE(balance, 0) + ?, walletId = ? WHERE adminId = ?';
    const walletId = uuidv4();
    await database.execute(updateAdminQuery, [parsedDepositAmount, walletId, adminId]);

    const updatedAdminQuery = 'SELECT * FROM Admin WHERE adminId = ?';
    const [updatedAdmin] = await database.execute(updatedAdminQuery, [adminId]);
    const newAdmin = {
      adminId,
      walletId,
      balance: updatedAdmin[0].balance,
    };
    return res.status(statusCode.create).json(apiResponseSuccess(newAdmin, true, statusCode.create, 'Deposit balance successful'));
  } catch (error) {
    res
      .status(statusCode.internalServerError)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? statusCode.internalServerError, error.errMessage ?? error.message));
  }
};
export const sendBalance = async (req, res) => {
  try {
    const { balance, adminId, userId } = req.body;
    const adminQuery = 'SELECT * FROM Admin WHERE adminId = ?';
    const [admin] = await database.execute(adminQuery, [adminId]);
    if (!admin.length) {
      return res.status(statusCode.badRequest).json(apiResponseErr(null, false, statusCode.badRequest, 'Admin Not Found'));
    }

    const userQuery = 'SELECT * FROM User WHERE id = ?';
    const [user] = await database.execute(userQuery, [userId]);
    if (!user.length) {
      return res.status(statusCode.badRequest).json(apiResponseErr(null, false, statusCode.badRequest, 'User Not Found'));
    }

    if (isNaN(balance)) {
      return res.status(statusCode.badRequest).json(apiResponseErr(null, false, statusCode.badRequest, 'Invalid Balance'));
    }

    const parsedDepositAmount = parseFloat(balance);

    if (admin[0].balance < parsedDepositAmount) {
      return res.status(statusCode.badRequest).json(apiResponseErr(null, false, statusCode.badRequest, 'Insufficient Balance For Transfer'));
    }

    const updateAdminBalanceQuery = 'UPDATE Admin SET balance = balance - ? WHERE adminId = ?';
    await database.execute(updateAdminBalanceQuery, [parsedDepositAmount, adminId]);

    const updateUserBalanceQuery = 'UPDATE User SET balance = balance + ? WHERE id = ?';
    await database.execute(updateUserBalanceQuery, [parsedDepositAmount, userId]);

    const newUserWalletId = uuidv4();
    const updateUserWalletIdQuery = 'UPDATE User SET walletId = ? WHERE id = ?';
    await database.execute(updateUserWalletIdQuery, [newUserWalletId, userId]);

    const transactionRecordQuery = `
      INSERT INTO TransactionRecord (userId, transactionType, amount, date)
      VALUES (?, 'Credit', ?, ?)
    `;
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await database.execute(transactionRecordQuery, [userId, parsedDepositAmount, currentDate]);

    const successResponse = {
      userId,
      balance: user[0].balance,
      walletId: newUserWalletId,
    };
    return res.status(statusCode.create).json(apiResponseSuccess(successResponse, true, statusCode.create, 'Send balance to User successful'));
  } catch (error) {
    console.error('Error sending balance:', error);
    res
      .status(statusCode.internalServerError)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? statusCode.internalServerError, error.errMessage ?? error.message));
  }
};

export const afterWining = async (req, res) => {
  const { marketId, runnerId, isWin } = req.body;
  try {
    const updateRunnerQuery = `
      UPDATE Runner 
      SET isWin = ? 
      WHERE marketId = ? AND runnerId = ?;
    `;
    await database.execute(updateRunnerQuery, [isWin, marketId, runnerId]);

    const [gameData] = await database.execute('SELECT gameId FROM Market WHERE marketId = ?', [marketId]);
    const gameId = gameData[0].gameId;

    const updateUserBalancesQuery = `
      UPDATE User u
      INNER JOIN MarketBalance mb ON u.id = mb.userId
      INNER JOIN Runner r ON mb.runnerId = r.runnerId
      SET u.balance = CASE
          WHEN r.runnerId = ? THEN u.balance + mb.bal + ?
          ELSE u.balance + mb.bal - ?
        END,
        u.marketListExposure = ?
      WHERE mb.marketId = ?;
    `;

    const marketListExposure = {};
    marketListExposure[marketId] = 0;

    const exposureIncrement = isWin ? `mb.bal + COALESCE(JSON_UNQUOTE(JSON_EXTRACT(u.marketListExposure, CONCAT('$.', '${marketId}'))), 0)` : 0;
    const exposureDecrement = isWin ? `COALESCE(JSON_UNQUOTE(JSON_EXTRACT(u.marketListExposure, CONCAT('$.', '${marketId}'))), 0)` : 0;

    await database.execute(updateUserBalancesQuery, [runnerId, exposureIncrement, exposureDecrement, JSON.stringify([marketListExposure]), marketId]);

    const insertProfitLossQuery = `
    INSERT INTO ProfitLoss (userId, gameId, marketId, runnerId, profitLoss, date) 
    SELECT userId, ?, ?, ?, bal, NOW() 
    FROM MarketBalance 
    WHERE marketId = ? AND runnerId = ?;
  `;

    await database.execute(insertProfitLossQuery, [gameId, marketId, runnerId, marketId, runnerId]);

    if (isWin) {
      const deleteOrdersQuery = `
        DELETE FROM currentOrder 
        WHERE marketId = ?;
      `;
      await database.execute(deleteOrdersQuery, [marketId]);

      const insertBetHistoryQuery = `
        INSERT INTO betHistory (userId, gameId, gameName, marketId, marketName, runnerId, runnerName, rate, value, type, date, bidAmount, isWin, profitLoss) 
        SELECT userId, gameId, gameName, marketId, marketName, runnerId, runnerName, rate, value, type, date, bidAmount, ?, profitLoss
        FROM currentOrder 
        WHERE marketId = ?;
      `;
      await database.execute(insertBetHistoryQuery, [isWin, marketId]);
    }
    return res.status(statusCode.success).send(apiResponseSuccess(null, true, statusCode.success, 'success'));
  } catch (error) {
    res.status(error.responseCode ?? statusCode.internalServerError).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? statusCode.internalServerError, error.errMessage ?? error.message));
  }
};
