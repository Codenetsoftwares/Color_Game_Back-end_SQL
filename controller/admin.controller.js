import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { apiResponseErr, apiResponseSuccess } from '../middleware/serverError.js';
import { statusCode } from '../helper/statusCodes.js';
import admins from '../models/admin.model.js';
import { string } from '../constructor/string.js';
import marketSchema from '../models/market.model.js';
import userSchema from '../models/user.model.js';
import Sequelize from '../db.js';
import transactionRecord from '../models/transactionRecord.model.js';
import Runner from '../models/runner.model.js';
import Market from '../models/market.model.js';
import MarketBalance from '../models/marketBalance.js';
import ProfitLoss from '../models/profitLoss.js';
import CurrentOrder from '../models/currentOrder.model.js';
import BetHistory from '../models/betHistory.model.js';
import { Op } from 'sequelize';

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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = await admins.create({
      adminId: uuidv4(),
      userName,
      password: hashedPassword,
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
        userName: { [Op.like]: `%${searchQuery}%` },
      },
    });
    const totalItems = countQuery;

    const totalPages = Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;

    const users = await userSchema.findAll({
      where: {
        userName: { [Op.like]: `%${searchQuery}%` },
      },
      limit: pageSize,
      offset: offset,
    });

    if (!users || users.length === 0) {
      throw apiResponseErr(null, false, statusCode.badRequest, 'User not found');
    }

    const paginationData = {
      page,
      totalPages,
      totalItems,
    };

    return res
      .status(statusCode.success)
      .json(apiResponseSuccess(users, true, statusCode.success, 'success', paginationData));
  } catch (error) {
    console.log(error);
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
          transactionType: 'credit',
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
    console.log(req.body);
    const { marketId, runnerId, isWin } = req.body;
    let gameId = null;

    const market = await Market.findOne({
      where: { marketId },
      include: [{ model: Runner, required: false }],
    });

    if (!market) {
      return res.status(statusCode.badRequest).json(apiResponseErr(null, false, statusCode.badRequest, 'Market not found'));
    }

    gameId = market.gameId;

    if (market.runners) {
      market.runners.forEach(runner => {
        if (String(runner.runnerId) === runnerId) {
          runner.isWin = isWin;
        } else {
          runner.isWin = false;
        }
      });
    }

    if (isWin) {
      market.announcementResult = true;
    }

    await market.save();

    const users = await MarketBalance.findAll({
      where: { marketId },
    });

    for (const user of users) {
      try {
        const runnerBalance = await MarketBalance.findOne({
          where: { marketId, runnerId, userId: user.userId },
        });

        if (runnerBalance) {
          const userDetails = await userSchema.findOne({
            where: { userId: user.userId },
          });

          if (userDetails) {
            const marketExposureEntry = userDetails.marketListExposure.find(item => Object.keys(item)[0] === marketId);
            if (marketExposureEntry) {
              const marketExposureValue = Number(marketExposureEntry[marketId]);
              const runnerBalanceValue = Number(runnerBalance.bal);

              if (isWin) {
                userDetails.balance += (runnerBalanceValue + marketExposureValue);
                console.log(`Updated Balance after win: ${userDetails.balance}`);
              } else {
                console.log(`No win. Balance remains the same: ${userDetails.balance}`);
              }

              await ProfitLoss.create({
                userId: user.userId,
                gameId,
                marketId,
                runnerId,
                date: new Date(),
                profitLoss: runnerBalanceValue,
              });

              userDetails.marketListExposure = userDetails.marketListExposure.filter(item => Object.keys(item)[0] !== marketId);

              await userSchema.update(
                { marketListExposure: userDetails.marketListExposure },
                { where: { userId: user.userId } },
              );

              await userDetails.save();

              await MarketBalance.destroy({
                where: { marketId, runnerId, userId: user.userId },
              });
            } else {
              console.error(`Market exposure not found for marketId ${marketId}`);
            }
          } else {
            console.error(`User details not found for userId ${user.userId}`);
          }
        } else {
          console.error(`Runner balance not found for marketId ${marketId} and runnerId ${runnerId}`);
        }
      } catch (error) {
        console.error('Error processing user:', error);
      }
    }

    if (isWin) {
      const orders = await CurrentOrder.findAll({
        where: { marketId },
      });

      for (const order of orders) {
        await BetHistory.create({
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
        });
      }

      await CurrentOrder.destroy({
        where: { marketId },
      });
    }

    return res.status(statusCode.success).json(apiResponseSuccess(null, true, statusCode.success, 'Success'));
  } catch (error) {
    console.error('Error sending balance:', error);
    return res.status(statusCode.internalServerError).json(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
};




