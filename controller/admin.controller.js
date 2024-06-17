import { database } from '../controller/database.controller.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { apiResponseErr, apiResponseSuccess, apiResponsePagination } from '../middleware/serverError.js';
import { statusCode } from '../helper/statusCodes.js';
import admins from '../models/admin.model.js';
import { string } from '../constructor/string.js';
import marketSchema from '../models/market.model.js';
import userSchema from '../models/user.model.js';
import Sequelize from '../db.js';
import transactionRecord from '../models/transactionRecord.model.js';

dotenv.config();
// done
export const createAdmin = async (req, res) => {
  const { userName, password } = req.body;
  try {
    const existingAdmin = await admins.findOne({ where: { userName } });

    if (existingAdmin) {
      return res
        .status(statusCode.badRequest)
        .json(apiResponseErr(null, false, statusCode.badRequest, 'Admin already exists'));
    }

    const newAdmin = await admins.create({
      adminId: uuidv4(),
      userName,
      password,
      roles: string.Admin,
    });

    return res
      .status(statusCode.create)
      .json(apiResponseSuccess(null, true, statusCode.create, 'Admin created successfully'));
  } catch (error) {
    return res
      .status(statusCode.internalServerError)
      .json(
        apiResponseErr(
          error.data ?? null,
          false,
          error.responseCode ?? statusCode.internalServerError,
          error.errMessage ?? error.message,
        ),
      );
  }
};
// done
export const adminLogin = async (req, res) => {
  const { userName, password } = req.body;
  try {
    const existingAdmin = await admins.findOne({ where: { userName } });

    if (!existingAdmin) {
      console.log('Admin not found');
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, false, statusCode.badRequest, 'Admin Does Not Exist'));
    }

    const isPasswordValid = await existingAdmin.validPassword(password);

    if (!isPasswordValid) {
      console.log('Invalid password');
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, false, statusCode.badRequest, 'Invalid username or password'));
    }

    const accessTokenResponse = {
      id: existingAdmin.id,
      adminId: existingAdmin.adminId,
      userName: existingAdmin.userName,
      userType: existingAdmin.userType || 'admin',
    };

    const accessToken = jwt.sign(accessTokenResponse, process.env.JWT_SECRET_KEY, {
      expiresIn: '1d',
    });

    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          {
            accessToken,
            adminId: existingAdmin.adminId,
            userName: existingAdmin.userName,
            userType: existingAdmin.userType || 'admin',
          },
          true,
          statusCode.success,
          'Admin login successfully',
        ),
      );
  } catch (error) {
    console.error('Error in adminLogin:', error.message);
    res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          error.data ?? null,
          false,
          error.responseCode ?? statusCode.internalServerError,
          error.errMessage ?? error.message,
        ),
      );
  }
};
// done
export const checkMarketStatus = async (req, res) => {
  const marketId = req.params.marketId;
  const { status } = req.body;

  try {
    const market = await marketSchema.findOne({ where: { marketId } });

    if (!market) {
      return res.status(statusCode.notFound).json(apiResponseErr(null, false, statusCode.notFound, 'Market not found'));
    }

    market.isActive = status;
    await market.save();

    const statusMessage = status ? 'Market is active' : 'Market is suspended';
    res.status(statusCode.success).send(apiResponseSuccess(statusMessage, true, statusCode.success, 'success'));
  } catch (error) {
    res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          error.data ?? null,
          false,
          error.responseCode ?? statusCode.internalServerError,
          error.errMessage ?? error.message,
        ),
      );
  }
};
// done
export const getAllUsers = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
    const searchQuery = req.query.search ? req.query.search.toLowerCase() : '';

    const countQuery = await userSchema.count({
      where: {
        userName: { [Sequelize.Op.like]: `%${searchQuery}%` },
      },
    });
    const totalItems = countQuery;

    const totalPages = Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;

    const users = await userSchema.findAll({
      where: {
        userName: { [Sequelize.Op.like]: `%${searchQuery}%` },
      },
      limit: pageSize,
      offset: offset,
    });

    if (!users || users.length === 0) {
      throw new Error('User not found');
    }

    const paginationData = {
      page,
      totalPages,
      totalItems,
    };

    res.status(statusCode.success).json(apiResponseSuccess(users, true, statusCode.success, 'success', paginationData));
  } catch (error) {
    console.error('Error fetching users:', error);
    res
      .status(statusCode.internalServerError)
      .json(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
};
// Done
export const deposit = async (req, res) => {
  try {
    const { adminId, depositAmount } = req.body;

    const existingAdmin = await admins.findOne({ where: { adminId } });

    if (!existingAdmin) {
      return res.status(statusCode.notFound).json(apiResponseErr(null, false, statusCode.notFound, 'Admin Not Found'));
    }

    const parsedDepositAmount = parseFloat(depositAmount);

    await existingAdmin.increment('balance', { by: parsedDepositAmount });

    const updatedAdmin = await admins.findOne({ where: { adminId } });

    if (!updatedAdmin) {
      throw new Error('Failed to fetch updated admin');
    }

    const newAdmin = {
      adminId: updatedAdmin.adminId,
      walletId: updatedAdmin.walletId,
      balance: updatedAdmin.balance,
    };

    return res
      .status(statusCode.create)
      .json(apiResponseSuccess(newAdmin, true, statusCode.create, 'Deposit balance successful'));
  } catch (error) {
    console.error('Error depositing balance:', error);
    res
      .status(statusCode.internalServerError)
      .json(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
};
// done
export const sendBalance = async (req, res) => {
  try {
    const { balance, adminId, userId } = req.body;

    const admin = await admins.findOne({ where: { adminId } });
    if (!admin) {
      return res
        .status(statusCode.badRequest)
        .json(apiResponseErr(null, false, statusCode.badRequest, 'Admin Not Found'));
    }

    const user = await userSchema.findOne({ where: { userId } });
    if (!user) {
      return res
        .status(statusCode.badRequest)
        .json(apiResponseErr(null, false, statusCode.badRequest, 'User Not Found'));
    }

    const parsedDepositAmount = parseFloat(balance);
    if (isNaN(parsedDepositAmount)) {
      return res
        .status(statusCode.badRequest)
        .json(apiResponseErr(null, false, statusCode.badRequest, 'Invalid Balance'));
    }

    if (admin.balance < parsedDepositAmount) {
      return res
        .status(statusCode.badRequest)
        .json(apiResponseErr(null, false, statusCode.badRequest, 'Insufficient Balance For Transfer'));
    }

    await Sequelize.transaction(async (t) => {
      await admins.update(
        { balance: Sequelize.literal(`balance - ${parsedDepositAmount}`) },
        { where: { adminId }, transaction: t },
      );

      await userSchema.update(
        { balance: Sequelize.literal(`balance + ${parsedDepositAmount}`), walletId: user.walletId },
        { where: { userId }, transaction: t },
      );

      await transactionRecord.create(
        {
          userId,
          transactionType: 'Credit',
          amount: parsedDepositAmount,
          date: Date.now(),
        },
        { transaction: t },
      );
    });

    const successResponse = {
      userId,
      balance: user.balance,
      walletId: user.walletId,
    };
    return res
      .status(statusCode.create)
      .json(apiResponseSuccess(null, true, statusCode.create, 'Send balance to User successful'));
  } catch (error) {
    console.error('Error sending balance:', error);
    res
      .status(statusCode.internalServerError)
      .json(apiResponseErr(null, false, statusCode.internalServerError, error.message));
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

    const exposureIncrement = isWin
      ? `mb.bal + COALESCE(JSON_UNQUOTE(JSON_EXTRACT(u.marketListExposure, CONCAT('$.', '${marketId}'))), 0)`
      : 0;
    const exposureDecrement = isWin
      ? `COALESCE(JSON_UNQUOTE(JSON_EXTRACT(u.marketListExposure, CONCAT('$.', '${marketId}'))), 0)`
      : 0;

    await database.execute(updateUserBalancesQuery, [
      runnerId,
      exposureIncrement,
      exposureDecrement,
      JSON.stringify([marketListExposure]),
      marketId,
    ]);

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
    res
      .status(error.responseCode ?? statusCode.internalServerError)
      .send(
        apiResponseErr(
          error.data ?? null,
          false,
          error.responseCode ?? statusCode.internalServerError,
          error.errMessage ?? error.message,
        ),
      );
  }
};
