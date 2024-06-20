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
import Runner from '../models/runner.model.js';
import Market from '../models/market.model.js';

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
  try {
    const { marketId, runnerId, isWin } = req.body
    const runner = await Runner.findOne({ where: { runnerId } });
    if (!runner) {
      throw new Error('Runner not found');
    }

    let gameId = null;
    let flag = false;

    const markets = await Market.findAll({ where: { marketId } });

    for (const market of markets) {
      if (!flag) {
        gameId = market.gameId;
        console.log("gameId1", gameId);
      }
      console.log("gameId", gameId);

      const runners = await Runner.findAll({ where: { marketId } });

      for (const runner of runners) {
        if (String(runner.runnerId) === runnerId) {
          await runner.update({ isWin });
        } else {
          await runner.update({ isWin: false });
        }
      }

      if (isWin) {
        await market.update({ announcementResult: true });
      }

      flag = true;
      break;
    }

    const users = await MarketBalance.findAll({ where: { marketId } });

    for (const user of users) {
      const runnerBalance = user.runnerBalance.find(item => String(item.runnerId) === runnerId);

      if (runnerBalance) {
        const marketExposure = user.wallet.marketListExposure.find(item => Object.keys(item)[0] === marketId);

        if (marketExposure) {
          const marketExposureValue = Number(marketExposure[marketId]);

          if (isWin) {
            user.wallet.balance += runnerBalance.bal + marketExposureValue;
          } else {
            runnerBalance.bal -= marketExposureValue;
            user.wallet.balance += runnerBalance.bal;
          }

          const profitLossEntry = await ProfitLoss.create({
            userId: user._id,
            gameId,
            marketId,
            runnerId,
            date: new Date(),
            profitLoss: runnerBalance.bal
          });

          const marketIndex = user.wallet.marketListExposure.findIndex(item => Object.keys(item)[0] === marketId);
          if (marketIndex !== -1) {
            user.wallet.marketListExposure.splice(marketIndex, 1);
          }

          await user.save();
        }
      }
    }

    if (isWin) {
      const market = await Market.findOne({ where: { marketId, announcementResult: true } });

      if (market) {
        const orders = await CurrentOrder.findAll({ where: { marketId } });

        for (const order of orders) {
          const betHistoryEntry = {
            userId: order.userId,
            gameId: order.gameId,
            gameName: order.gameName,
            marketId: order.marketId,
            marketName: order.marketName,
            runnerId: order.runnerId,
            runnerName: order.runnerName,
            rate: order.rate,
            value: order.value,
            type: order.type,
            date: new Date(),
            bidAmount: order.bidAmount,
            isWin: order.isWin,
            profitLoss: order.profitLoss,
          };

          await BetHistory.create({ ...betHistoryEntry });
        }

        await CurrentOrder.destroy({ where: { marketId } });
      }
    }

    return res
      .status(statusCode.success)
      .json(apiResponseSuccess(null, true, statusCode.success, 'success'));

  } catch (error) {
    console.error('Error sending balance:', error);
    res
      .status(statusCode.internalServerError)
      .json(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
};
