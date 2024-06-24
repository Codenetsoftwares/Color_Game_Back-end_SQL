import { database } from '../controller/database.controller.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { apiResponseErr, apiResponsePagination, apiResponseSuccess } from '../middleware/serverError.js';
import moment from 'moment';
import { string } from '../constructor/string.js';
import userSchema from '../models/user.model.js';
import { statusCode } from '../helper/statusCodes.js';
import Market from '../models/market.model.js';
import Runner from '../models/runner.model.js';
import { Op, Sequelize } from 'sequelize';
import MarketBalance from '../models/marketBalance.js';
import CurrentOrder from '../models/currentOrder.model.js';
import Game from '../models/game.model.js';
import BetHistory from '../models/betHistory.model.js';
import ProfitLoss from '../models/profitLoss.js';
import exp from 'constants';
import sequelize from '../db.js';

// done
export const createUser = async (req, res) => {
  const { firstName, lastName, userName, phoneNumber, password, userId, walletId } = req.body;
  try {
    const existingUser = await userSchema.findOne({ where: { userName } });

    if (existingUser) {
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, false, statusCode.badRequest, 'User already exists'));
    }

    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await userSchema.create({
      firstName,
      lastName,
      userName,
      phoneNumber,
      walletId,
      userId,
      password,
      roles: string.User,
    });

    return res
      .status(statusCode.create)
      .send(apiResponseSuccess(null, true, statusCode.create, 'User created successfully'));
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
export const userUpdate = async (req, res) => {
  const { userId } = req.params;
  const { firstName, lastName, userName, phoneNumber, password } = req.body;

  try {
    const user = await userSchema.findOne({ where: { userId } });

    if (!user) {
      return res.status(statusCode.notFound).send(apiResponseErr(null, false, statusCode.notFound, 'User not found'));
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (userName) updateData.userName = userName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateData.password = hashedPassword;
    }

    await user.update(updateData);

    res
      .status(statusCode.success)
      .send(apiResponseSuccess(null, true, statusCode.success, 'User updated successfully'));
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
export const eligibilityCheck = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { eligibilityCheck } = req.body;

    const user = await userSchema.findOne({ where: { userId } });

    if (!user) {
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, false, statusCode.badRequest, 'User not found'));
    }

    user.eligibilityCheck = eligibilityCheck;
    await user.save();

    return res.status(200).json({
      message: eligibilityCheck ? 'User Eligible' : 'User Not Eligible',
    });
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
// DONE
export const resetPassword = async (req, res) => {
  try {
    const { oldPassword, password, confirmPassword } = req.body;
    const user = req.user;
    const userId = user.userId;

    if (password !== confirmPassword) {
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, false, statusCode.badRequest, 'Confirm Password does not match with Password'));
    }

    const userData = await userSchema.findOne({ where: { userId } });

    if (!userData) {
      return res
        .status(statusCode.notFound)
        .send(apiResponseErr(null, false, statusCode.unauthorize, 'User Not Found'));
    }

    const oldPasswordIsCorrect = await bcrypt.compare(oldPassword, userData.password);
    if (!oldPasswordIsCorrect) {
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, false, statusCode.unauthorize, 'Invalid old password'));
    }

    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(password, salt);
    await userData.save();

    res
      .status(statusCode.success)
      .send(apiResponseSuccess(null, true, statusCode.success, 'Password Reset Successfully'));
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
export const userGame = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
    const searchQuery = req.query.search || '';

    const { count, rows } = await Game.findAndCountAll({
      attributes: ['gameId', 'gameName', 'description'],
      where: {
        gameName: {
          [Op.like]: `%${searchQuery}%`,
        },
      },
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });

    if (!rows || rows.length === 0) {
      return res
        .status(statusCode.badRequest)
        .json(apiResponseErr(null, false, statusCode.badRequest, 'Data Not Found'));
    }

    const gameData = rows.map((game) => ({
      gameId: game.gameId,
      gameName: game.gameName,
      description: game.description,
    }));

    const totalPages = Math.ceil(count / pageSize);

    const paginationData = apiResponsePagination(page, totalPages, count);

    return res
      .status(statusCode.success)
      .json(apiResponseSuccess(gameData, true, statusCode.success, 'Success', paginationData));
  } catch (error) {
    console.error('Error fetching games:', error);
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
export const userMarket = async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const searchQuery = req.query.search ? req.query.search.toLowerCase() : '';

    const { count, rows } = await Market.findAndCountAll({
      where: {
        gameId: gameId,
        marketName: {
          [Op.like]: `%${searchQuery}%`,
        },
      },
      offset: (page - 1) * pageSize,
      limit: pageSize,
      // include: [
      //   {
      //     model: Game,
      //     attributes: ['gameId', 'gameName'],
      //   },
      // ],
    });

    const totalPages = Math.ceil(count / pageSize);

    const paginationData = {
      currentPage: page,
      totalPages: totalPages,
      totalItems: count,
    };

    return res
      .status(statusCode.success)
      .send(apiResponseSuccess(rows, true, statusCode.success, 'Success', paginationData));
  } catch (error) {
    console.error('Error fetching markets:', error);
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
export const userRunners = async (req, res) => {
  try {
    const marketId = req.params.marketId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const searchQuery = req.query.search || '';

    const whereConditions = {
      marketId: marketId,
      ...(searchQuery && {
        runnerName: {
          [Op.like]: `%${searchQuery}%`,
        },
      }),
    };

    const { rows: runners, count: totalItems } = await Runner.findAndCountAll({
      where: whereConditions,
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });

    const transformedRunners = runners.map((runner) => ({
      runnerId: runner.runnerId,
      runnerName: runner.runnerName,
      rates: [
        {
          back: runner.back,
          lay: runner.lay,
        },
      ],
    }));

    const totalPages = Math.ceil(totalItems / pageSize);

    const paginationData = apiResponsePagination(page, totalPages, totalItems);

    res
      .status(statusCode.success)
      .send(apiResponseSuccess(transformedRunners, true, statusCode.success, 'success', paginationData));
  } catch (error) {
    console.error('Error fetching runners:', error);
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
export const getAllGameData = async (req, res) => {
  try {
    const gameData = await Game.findAll({
      attributes: ['gameId', 'gameName', 'description', 'isBlink'],
      include: [
        {
          model: Market,
          attributes: ['marketId', 'marketName', 'participants', 'timeSpan', 'announcementResult', 'isActive'],
          include: [
            {
              model: Runner,
              attributes: ['runnerId', 'runnerName', 'isWin', 'bal', 'back', 'lay'],
            },
          ],
        },
      ],
    });

    const formattedGameData = gameData.map((game) => ({
      gameId: game.gameId,
      gameName: game.gameName,
      description: game.description,
      isBlink: game.isBlink,
      markets: game.Markets.map((market) => ({
        marketId: market.marketId,
        marketName: market.marketName,
        participants: market.participants,
        timeSpan: market.timeSpan,
        announcementResult: market.announcementResult,
        isActive: market.isActive,
        runners: market.Runners.map((runner) => ({
          runnerName: {
            runnerId: runner.runnerId,
            runnerName: runner.runnerName,
            isWin: runner.isWin,
            bal: runner.bal,
          },
          rate: [
            {
              back: runner.back,
              lay: runner.lay,
            },
          ],
        })),
      })),
    }));

    res.status(statusCode.success).json(apiResponseSuccess(formattedGameData, true, statusCode.success, 'Success'));
  } catch (error) {
    console.error('Error retrieving game data:', error);
    res
      .status(statusCode.internalServerError)
      .json(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
};
// done
export const filteredGameData = async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const gameData = await Game.findAll({
      where: { gameId },
      attributes: ['gameId', 'gameName', 'description', 'isBlink'],
      include: [
        {
          model: Market,
          attributes: ['marketId', 'marketName', 'participants', 'timeSpan', 'announcementResult', 'isActive'],
          include: [
            {
              model: Runner,
              attributes: ['runnerId', 'runnerName', 'isWin', 'bal', 'back', 'lay'],
            },
          ],
        },
      ],
    });

    if (!gameData) {
      throw apiResponseErr(null, false, statusCode.badRequest, 'Game not found');
    }

    const formattedGameData = gameData.map((game) => ({
      gameId: game.gameId,
      gameName: game.gameName,
      description: game.description,
      isBlink: game.isBlink,
      markets: game.Markets.map((market) => ({
        marketId: market.marketId,
        marketName: market.marketName,
        participants: market.participants,
        timeSpan: market.timeSpan,
        announcementResult: market.announcementResult,
        isActive: market.isActive,
        runners: market.Runners.map((runner) => ({
          runnerName: {
            runnerId: runner.runnerId,
            runnerName: runner.runnerName,
            isWin: runner.isWin,
            bal: runner.bal,
          },
          rate: [
            {
              back: runner.back,
              lay: runner.lay,
            },
          ],
        })),
      })),
    }));

    // Send the formatted response
    res.status(statusCode.success).json(apiResponseSuccess(formattedGameData, true, statusCode.success, 'Success'));
  } catch (error) {
    console.error('Error retrieving game data:', error);
    res
      .status(statusCode.internalServerError)
      .json(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
};
// done
export const userGif = async (req, res) => {
  try {
    const gifData = await gifSchema.findAll({
      attributes: ['imageId', 'image', 'text', 'headingText', 'isActive'],
    });

    res.status(statusCode.success).send(apiResponseSuccess(gifData, true, statusCode.success, 'success'));
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
export const getUserWallet = async (req, res) => {
  try {
    const userId = req.params.userId;

    const userData = await userSchema.findOne({ where: { userId } });

    if (!userData || userData.length === 0) {
      return res.status(statusCode.notFound).send(apiResponseErr(null, false, statusCode.notFound, 'User not found'));
    }

    const getBalance = {
      walletId: userData.walletId,
      balance: userData.balance,
      exposure: userData.exposure,
      marketListExposure: userData.marketListExposure,
    };

    res.status(statusCode.success).send(apiResponseSuccess(getBalance, true, statusCode.success, 'success'));
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
export const transactionDetails = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const { count, rows: transactionData } = await transactionRecord.findAndCountAll({
      where: { userId },
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['createdAt', 'DESC']],
    });

    if (count === 0) {
      throw apiResponseErr(null, statusCode.badRequest, false, 'User Not Found or No Transactions Found');
    }

    const totalItems = count;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginationData = apiResponsePagination(page, totalPages, totalItems);

    res
      .status(statusCode.success)
      .send(apiResponseSuccess(transactionData, true, statusCode.success, 'Success', paginationData));
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
export const filterMarketData = async (req, res) => {
  try {
    const marketId = req.params.marketId;
    const userId = req.body?.userId;

    const marketDataRows = await Market.findAll({
      where: { marketId },
      include: [
        {
          model: Runner,
          required: false,
        },
      ],
    });

    if (marketDataRows.length === 0) {
      throw apiResponseErr(null, false, statusCode.badRequest, 'Market not found with MarketId');
    }

    let marketDataObj = {
      marketId: marketDataRows[0].marketId,
      marketName: marketDataRows[0].marketName,
      participants: marketDataRows[0].participants,
      timeSpan: marketDataRows[0].timeSpan,
      announcementResult: marketDataRows[0].announcementResult,
      isActive: marketDataRows[0].isActive,
      runners: [],
    };

    marketDataRows[0].Runners.forEach((runner) => {
      marketDataObj.runners.push({
        id: runner.id,
        runnerName: {
          runnerId: runner.runnerId,
          name: runner.runnerName,
          isWin: runner.isWin,
          bal: Math.round(parseFloat(runner.bal)),
        },
        rate: [
          {
            back: runner.back,
            lay: runner.lay,
          },
        ],
      });
    });

    if (userId) {
      const currentOrdersRows = await CurrentOrder.findAll({
        where: {
          userId,
          marketId,
        },
      });

      const userMarketBalance = {
        userId,
        marketId,
        runnerBalance: [],
      };

      marketDataObj.runners.forEach((runner) => {
        currentOrdersRows.forEach((order) => {
          if (order.type === 'back') {
            if (String(runner.runnerName.runnerId) === String(order.runnerId)) {
              runner.runnerName.bal += Number(order.bidAmount);
            } else {
              runner.runnerName.bal -= Number(order.value);
            }
          } else if (order.type === 'lay') {
            if (String(runner.runnerName.runnerId) === String(order.runnerId)) {
              runner.runnerName.bal -= Number(order.bidAmount);
            } else {
              runner.runnerName.bal += Number(order.value);
            }
          }
        });

        userMarketBalance.runnerBalance.push({
          runnerId: runner.runnerName.runnerId,
          bal: runner.runnerName.bal,
        });
      });

      for (const balance of userMarketBalance.runnerBalance) {
        const userMarketBalanceRows = await MarketBalance.findAll({
          where: {
            userId,
            marketId,
            runnerId: balance.runnerId,
          },
        });

        if (userMarketBalanceRows.length > 0) {
          await MarketBalance.update(
            { bal: balance.bal },
            {
              where: {
                userId,
                marketId,
                runnerId: balance.runnerId,
              },
            },
          );
        } else {
          await MarketBalance.create({
            userId,
            marketId,
            runnerId: balance.runnerId,
            bal: balance.bal,
          });
        }
      }
    }

    res.status(statusCode.success).send(apiResponseSuccess(marketDataObj, true, statusCode.success, 'Success'));
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
export const createBid = async (req, res) => {
  const { userId, gameId, marketId, runnerId, value, bidType, exposure, wallet, marketListExposure } = req.body;
  console.log('Request body:', req.body);
  try {
    if (!userId) {
      throw apiResponseErr(null, false, statusCode.badRequest, 'User ID is required');
    }
    if (value < 0) {
      throw apiResponseErr(null, false, statusCode.badRequest, 'Bid value cannot be negative');
    }
    const user = await userSchema.findOne({ where: { userId } });
    if (!user) {
      throw apiResponseErr(null, false, statusCode.badRequest, 'User Not Found');
    }
    if (user.balance < value) {
      throw apiResponseErr(null, false, statusCode.badRequest, 'Insufficient balance. Bid cannot be placed.');
    }
    const game = await Game.findOne({
      where: { gameId },
      include: {
        model: Market,
        as: 'Markets',
      },
    });
    if (!game) {
      throw apiResponseErr(null, false, statusCode.badRequest, 'Game Not Found');
    }
    const market = game.Markets.find((market) => String(market.marketId) === String(marketId));
    if (!market) {
      throw apiResponseErr(null, false, statusCode.badRequest, 'Market Not Found');
    }
    const runner = await Runner.findOne({ where: { marketId, runnerId } });
    if (!runner) {
      throw apiResponseErr(null, false, statusCode.badRequest, 'Runner Not Found');
    }
    const gameName = game.gameName;
    const marketName = market.marketName;
    const runnerName = runner.runnerName;
    if (bidType === 'back' || bidType === 'lay') {
      const adjustedRate = runner[bidType.toLowerCase()] - 1;
      const mainValue = Math.round(adjustedRate * value);
      const betAmount = bidType === 'back' ? value : mainValue;
      user.balance = wallet;
      user.exposure = exposure;
      user.marketListExposure = marketListExposure;
      const currentOrder = await CurrentOrder.create({
        userId: userId,
        gameId: gameId,
        gameName: gameName,
        marketId: marketId,
        marketName: marketName,
        runnerId: runnerId,
        runnerName: runnerName,
        type: bidType,
        value: value,
        rate: runner[bidType.toLowerCase()],
        date: new Date(),
        bidAmount: mainValue,
        exposure: exposure,
      });
      console.log('CurrentOrder created:', currentOrder);
      await user.save();
    }
    return res
      .status(statusCode.success)
      .send(apiResponseSuccess(null, true, statusCode.success, 'Bid placed successfully'));
  } catch (error) {
    return res
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
export const getUserBetHistory = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.userId;
    const marketId = req.params.marketId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const { startDate, endDate } = req.query;

    let start = null;
    let end = null;

    if (startDate) {
      start = moment(startDate, ['YYYY-MM-DD', 'DD/MM/YYYY', 'YYYY/MM/DD'], true);
      if (!start.isValid()) {
        throw new Error('startDate is not a valid date');
      }
    }

    if (endDate) {
      end = moment(endDate, ['YYYY-MM-DD', 'DD/MM/YYYY', 'YYYY/MM/DD'], true);
      if (!end.isValid()) {
        throw new Error('endDate is not a valid date');
      }

      if (end.isAfter(moment())) {
        throw new Error('Invalid End Date');
      }
    }

    if (start && end && end.isBefore(start)) {
      throw new Error('endDate should be after startDate');
    }

    const whereClause = {
      userId,
      marketId,
    };

    if (start && end) {
      whereClause.date = {
        [Op.between]: [start.format('YYYY-MM-DD HH:mm:ss'), end.endOf('day').format('YYYY-MM-DD HH:mm:ss')],
      };
    }

    const { count, rows } = await BetHistory.findAndCountAll({
      where: whereClause,
      attributes: ['gameName', 'marketName', 'runnerName', 'rate', 'value', 'type', 'date'],
      limit,
      offset: (page - 1) * limit,
    });

    const totalPages = Math.ceil(count / limit);
    const pageSize = limit;
    const totalItems = count;
    res.status(statusCode.success).send(apiResponseSuccess(
      { rows },
      true,
      statusCode.success,
      'Success',
      { totalPages, pageSize, totalItems, page }
    ));
  } catch (error) {
    res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          error.data ?? null,
          false,
          error.successCode ?? statusCode.internalServerError,
          error.errMessage ?? error.message,
        ),
      );
  }
};
// done
export const currentOrderHistory = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.userId;
    console.log('userId', userId);
    const marketId = req.params.marketId;
    // const page = parseInt(req.query.page, 10) || 1;
    // const limit = parseInt(req.query.limit, 10) || 5;

    if (!marketId) {
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, statusCode.badRequest, false, 'Market ID is required'));
    }

    const { rows } = await CurrentOrder.findAndCountAll({
      where: {
        userId,
        marketId,
      },
      attributes: ['runnerName', 'rate', 'value', 'type', 'bidAmount'],
      // limit,
      // offset: (page - 1) * limit,
    });

    // const totalPages = Math.ceil(count / limit);
    // const pageSize = limit;
    // const totalItems = count;
    res.status(statusCode.success).send(apiResponseSuccess(
      { rows },
      true,
      statusCode.success,
      'Success',
    ));
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
export const calculateProfitLoss = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.userId;
    const page = req.query.page || 1;
    let limit = parseInt(req.query.limit) || 5;
    const startDate = req.query.startDate + ' 00:00:00';
    const endDate = req.query.endDate + ' 23:59:59';

    const profitLossData = await ProfitLoss.findAll({
      attributes: [
        'gameId',
        [sequelize.fn('SUM', sequelize.col('profitLoss')), 'totalProfitLoss'],
      ],
      include: [
        {
          model: Game,
          attributes: ['gameName'],
        },
      ],
      where: {
        userId: userId,
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      group: ['gameId'],
      offset: (page - 1) * limit,
      limit: limit,
    });

    if (profitLossData.length === 0) {
      throw new Error('No profit/loss data found for the given date range.');
    }

    const totalItems = await ProfitLoss.count({
      where: {
        userId: userId,
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      distinct: true,
    });

    const totalPages = Math.ceil(totalItems / limit);

    const paginationData = {
      page: page,
      totalPages: totalPages,
      totalItems: totalItems,
    };

    const formattedProfitLossData = profitLossData.map((item) => ({
      gameId: item.gameId,
      gameName: item.Game.gameName,
      totalProfitLoss: item.dataValues.totalProfitLoss,
    }));

    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          formattedProfitLossData,
          true,
          statusCode.success,
          'Success',
          paginationData,
        ),
      );
  } catch (error) {
    console.error('Error calculating profit/loss:', error);
    res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          null,
          false,
          error.responseCode || statusCode.internalServerError,
          error.errMessage || error.message,
        ),
      );
  }
};
export const marketProfitLoss = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.userId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);

    const distinctMarketIds = await ProfitLoss.findAll({
      attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('marketId')), 'marketId']
      ],
      where: { userId: userId }
    });

    const marketsProfitLoss = await Promise.all(distinctMarketIds.map(async market => {
      const profitLossEntries = await ProfitLoss.findAll({
        attributes: [
          'marketId',
          [Sequelize.literal('CAST(profitLoss AS DECIMAL(10, 2))'), 'profitLoss']
        ],
        where: {
          userId: userId,
          marketId: market.marketId,
          date: { [Op.between]: [startDateObj, endDateObj] }
        }
      });

      if (profitLossEntries.length === 0) {
        throw new Error('No profit/loss data found for the given date range.');
      }

      const game = await Game.findOne({
        include: [{ model: Market, where: { marketId: market.marketId }, attributes: ['marketName'] }],
        attributes: ['gameName'],
      });

      const gameName = game.gameName;
      const marketName = game.Markets[0].marketName;
      const totalProfitLoss = profitLossEntries.reduce((acc, entry) => acc + parseFloat(entry.profitLoss), 0);

      const formattedTotalProfitLoss = totalProfitLoss.toFixed(2);

      return { marketId: market.marketId, marketName, gameName, totalProfitLoss: formattedTotalProfitLoss };
    }));

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedProfitLossData = marketsProfitLoss.slice(startIndex, endIndex);
    const totalItems = marketsProfitLoss.length;
    const totalPages = Math.ceil(totalItems / limit);

    const paginationData = {
      page: page,
      totalPages: totalPages,
      totalItems: totalItems
    };

    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          paginatedProfitLossData,
          true,
          statusCode.success,
          'Success',
          paginationData,
        ),
      );
  } catch (error) {
    res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          null,
          false,
          error.responseCode || statusCode.internalServerError,
          error.errMessage || error.message,
        ),
      );
  }
};
export const runnerProfitLoss = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.userId;
    const marketId = req.params.marketId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);

    const profitLossEntries = await ProfitLoss.findAll({
      where: {
        userId: userId,
        marketId: marketId,
        date: { [Op.between]: [startDateObj, endDateObj] }
      }
    });

    if (profitLossEntries.length === 0) {
      throw new Error('No profit/loss data found for the given date range.');
    }

    const runnersProfitLoss = await Promise.all(profitLossEntries.map(async entry => {
      const game = await Game.findOne({
        where: { gameId: entry.gameId },
        include: [
          {
            model: Market,
            where: { marketId: marketId },
            include: [{ model: Runner }]
          }
        ]
      });

      if (!game) {
        throw new Error(`Game data not found for gameId: ${entry.gameId}`);
      }

      const gameName = game.gameName;
      const marketName = game.Markets[0].marketName;
      const runner = game.Markets[0].Runners.find(runner => runner.runnerId === entry.runnerId);

      if (!runner) {
        throw new Error(`Runner data not found for runnerId: ${entry.runnerId}`);
      }

      const runnerName = runner.runnerName;

      return {
        gameName: gameName,
        marketName: marketName,
        runnerName: runnerName,
        runnerId: entry.runnerId,
        profitLoss: parseFloat(entry.profitLoss).toFixed(2)
      };
    }));

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedRunnersProfitLoss = runnersProfitLoss.slice(startIndex, endIndex);
    const totalItems = runnersProfitLoss.length;
    const totalPages = Math.ceil(totalItems / limit);

    const paginationData = {
      page: page,
      totalPages: totalPages,
      totalItems: totalItems
    };

    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          paginatedRunnersProfitLoss,
          true,
          statusCode.success,
          'Success',
          paginationData,
        ),
      );
  } catch (error) {
    res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          null,
          false,
          error.responseCode || statusCode.internalServerError,
          error.errMessage || error.message,
        ),
      );
  }
};
export const userMarketData = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.userId;

    const getCurrentMarket = await CurrentOrder.findAll({
      where: { userId },
      include: [{ model: Market, as: 'market', attributes: ['marketId', 'marketName'] }],
    });

    const currentMarketSet = new Set();

    getCurrentMarket.forEach((item) => {
      currentMarketSet.add(
        JSON.stringify({
          marketId: item.market.marketId,
          marketName: item.market.marketName,
        }),
      );
    });

    const currentMarketArray = Array.from(currentMarketSet).map((item) => JSON.parse(item));

    const getBetHistory = await BetHistory.findAll({
      where: { userId },
      include: [{ model: Market, as: 'market', attributes: ['marketId', 'marketName'] }],
    });

    const betHistorySet = new Set();

    getBetHistory.forEach((item) => {
      betHistorySet.add(
        JSON.stringify({
          marketId: item.market.marketId,
          marketName: item.market.marketName,
        }),
      );
    });

    const betHistoryArray = Array.from(betHistorySet).map((item) => JSON.parse(item));

    const responseData = {
      currentMarket: currentMarketArray,
      betHistory: betHistoryArray,
    };

    res.status(statusCode.success).send(apiResponseSuccess(responseData, true, statusCode.success, 'Success'));
  } catch (error) {
    console.error('Error fetching user market data:', error);
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
