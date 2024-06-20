import { database } from '../controller/database.controller.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { apiResponseErr, apiResponsePagination, apiResponseSuccess } from '../middleware/serverError.js';
import moment from 'moment';
import { string } from '../constructor/string.js';
import userSchema from '../models/user.model.js';
import { v4 as uuidv4 } from 'uuid';
import { statusCode } from '../helper/statusCodes.js';
import Market from '../models/market.model.js';
import Runner from '../models/runner.model.js';
import { Op } from 'sequelize';
import MarketBalance from '../models/marketBalance.js';
import CurrentOrder from '../models/currentOrder.model.js';
import Game from '../models/game.model.js';


// done
export const createUser = async (req, res) => {
  const { firstName, lastName, userName, phoneNumber, password } = req.body;
  try {
    const existingUser = await userSchema.findOne({ where: { userName } });

    if (existingUser) {
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, false, statusCode.badRequest, 'User already exists'));
    }
    const newUser = await userSchema.create({
      firstName,
      lastName,
      userName,
      userId: uuidv4(),
      phoneNumber,
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
      const passwordSalt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, passwordSalt);
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
export const loginUser = async (req, res) => {
  const { userName, password } = req.body;
  try {
    const existingUser = await userSchema.findOne({ where: { userName } });

    if (!existingUser) {
      console.log('Admin not found');
      return res.status(statusCode.badRequest).send(apiResponseErr(null, false, statusCode.badRequest, 'User Does Not Exist'));
    }

    const isPasswordValid = await existingUser.validPassword(password);

    if (!isPasswordValid) {
      console.log('Invalid password');
      return res.status(statusCode.badRequest).send(apiResponseErr(null, false, statusCode.badRequest, 'Invalid username or password'));
    }

    const accessTokenResponse = {
      id: existingUser.id,
      userName: existingUser.userName,
      isEighteen: existingUser.eligibilityCheck,
      UserType: existingUser.userType || 'user',
      wallet: existingUser.wallet
    };

    const accessToken = jwt.sign(accessTokenResponse, process.env.JWT_SECRET_KEY, {
      expiresIn: '1d',
    });

    res.status(statusCode.success).send(
      apiResponseSuccess(
        {
          accessToken,
          userId: existingUser.userId,
          userName: existingUser.userName,
          isEighteen: existingUser.eligibilityCheck,
          userType: existingUser.userType || 'user',
          wallet: existingUser.wallet,
        },
        true,
        statusCode.success,
        'Login successful',
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
    const userId = req.user.id;

    if (password !== confirmPassword) {
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, false, statusCode.badRequest, 'Confirm Password does not match with Password'));
    }

    const user = await userSchema.findByPk(userId);

    if (!user) {
      return res
        .status(statusCode.notFound)
        .send(apiResponseErr(null, false, statusCode.unauthorize, 'User Not Found'));
    }

    const oldPasswordIsCorrect = await user.validPassword(oldPassword);
    if (!oldPasswordIsCorrect) {
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, false, statusCode.unauthorize, 'Invalid old password'));
    }

    user.password = password;
    await user.save();

    res
      .status(statusCode.success)
      .send(apiResponseSuccess(user, true, statusCode.success, 'Password Reset Successfully'));
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
    const gameDataQuery = `SELECT G.gameId, G.gameName, G.description, G.isBlink, M.marketId, M.marketName, M.participants, M.timeSpan, M.announcementResult, M.isActive, R.runnerId, R.runnerName, R.isWin, R.bal, R.back AS BackRate, R.lay AS LayRate FROM game G LEFT JOIN market M ON G.gameId = M.gameId LEFT JOIN runner R ON M.marketId = R.marketId `;
    const [gameDataRows] = await database.execute(gameDataQuery);

    const allGameData = gameDataRows.reduce((acc, row) => {
      let gameIndex = acc.findIndex((game) => game.gameId === row.gameId);
      if (gameIndex === -1) {
        acc.push({
          gameId: row.gameId,
          gameName: row.gameName,
          description: row.description,
          isBlink: row.isBlink,
          markets: [],
        });
        gameIndex = acc.length - 1;
      }

      let marketIndex = acc[gameIndex].markets.findIndex((market) => market.marketId === row.marketId);
      if (marketIndex === -1) {
        acc[gameIndex].markets.push({
          marketId: row.marketId,
          marketName: row.marketName,
          participants: row.participants,
          timeSpan: row.timeSpan,
          announcementResult: row.announcementResult,
          isActive: row.isActive,
          runners: [],
        });
        marketIndex = acc[gameIndex].markets.length - 1;
      }
      if (row.runnerId) {
        acc[gameIndex].markets[marketIndex].runners.push({
          runnerName: {
            runnerId: row.runnerId,
            name: row.runnerName,
            isWin: row.isWin,
            bal: row.bal,
          },
          rate: [
            {
              back: row.BackRate,
              lay: row.LayRate,
            },
          ],
        });
      }

      return acc;
    }, []);

    res.status(statusCode.success).send(apiResponseSuccess(allGameData, true, statusCode.success, 'Success'));
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
export const filteredGameData = async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const gameDataQuery = `
      SELECT
        G.gameId,
        G.gameName,
        G.description,
        G.isBlink,
        M.marketId,
        M.marketName,
        M.participants,
        M.timeSpan,
        M.announcementResult,
        M.isActive,
        R.runnerId,
        R.runnerName,
        R.isWin,
        R.bal,
        RA.back,
        RA.lay
      FROM game G
      LEFT JOIN market M ON G.gameId = M.gameId
      LEFT JOIN runner R ON M.marketId = R.marketId
      LEFT JOIN rate RA ON R.runnerId = RA.runnerId
      WHERE G.gameId = ?
    `;
    const [gameDataRows] = await database.execute(gameDataQuery, [gameId]);

    if (gameDataRows.length === 0) {
      throw apiResponseErr(null, false, statusCode.badRequest, 'Game not found');
    }
    const { gameName, description } = gameDataRows[0];
    const gameData = gameDataRows.reduce((acc, row) => {
      if (!acc.gameId) {
        acc.gameId = row.gameId;
        acc.gameName = gameName;
        acc.description = description;
        acc.isBlink = row.isBlink;
        acc.markets = {};
      }

      if (!acc.markets[row.marketId]) {
        acc.markets[row.marketId] = {
          marketId: row.marketId,
          marketName: row.marketName,
          participants: row.participants,
          timeSpan: row.timeSpan,
          announcementResult: row.announcementResult,
          isActive: row.isActive,
          runners: [],
        };
      }
      acc.markets[row.marketId].runners.push({
        runnerName: {
          runnerId: row.runnerId,
          name: row.runnerName,
          isWin: row.isWin,
          bal: row.bal,
        },
        rate: [
          {
            back: row.back,
            lay: row.lay,
          },
        ],
      });

      return acc;
    }, {});
    const marketsArray = Object.values(gameData.markets);
    res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          { gameId, gameName, description, markets: marketsArray },
          true,
          statusCode.success,
          'Success',
        ),
      );
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
export const userGif = async (req, res) => {
  try {
    const gifQuery = `
      SELECT imageId, image, text, headingText, isActive
      FROM Gif
    `;

    const [gifData] = await database.execute(gifQuery);

    const formattedGif = gifData.map((data) => ({
      imageId: data.imageId,
      image: data.image,
      text: data.text,
      headingText: data.headingText,
      isActive: data.isActive,
    }));

    res.status(statusCode.success).send(apiResponseSuccess(formattedGif, true, statusCode.success));
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
export const getUserWallet = async (req, res) => {
  try {
    const userId = req.params.userId;
    const getUserQuery = `
          SELECT walletId, balance, exposure, marketListExposure
          FROM User
          WHERE id = ?
      `;
    const [userData] = await database.execute(getUserQuery, [userId]);

    if (!userData || userData.length === 0) {
      return res.status(statusCode.notFound).send(apiResponseErr(null, false, statusCode.notFound, 'User not found'));
    }

    const getBalance = {
      walletId: userData[0].walletId,
      balance: userData[0].balance,
      exposure: userData[0].exposure,
      marketListExposure: userData[0].marketListExposure,
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
export const transactionDetails = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const getUserQuery = `
      SELECT * FROM TransactionRecord
      WHERE userId = ?
    `;
    const [transactionData] = await database.execute(getUserQuery, [userId]);

    if (!transactionData || transactionData.length === 0) {
      throw apiResponseErr(null, statusCode.badRequest, false, 'User Not Found or No Transactions Found');
    }

    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, transactionData.length);

    const paginatedDetails = transactionData.slice(startIndex, endIndex);

    const totalItems = transactionData.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginationData = apiResponsePagination(page, totalPages, totalItems);

    res
      .status(statusCode.success)
      .send(apiResponseSuccess(paginatedDetails, true, statusCode.success, 'Success', paginationData));
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

    const marketQuery = `
    SELECT 
      R.id,
      M.marketId,
      M.marketName,
      M.participants,
      M.timeSpan,
      M.announcementResult,
      M.isActive,
      R.runnerId,
      R.runnerName,
      R.isWin,
      R.bal,
      R.back AS BackRate,
      R.lay AS LayRate
    FROM market M
    LEFT JOIN runner R ON M.marketId = R.marketId
    WHERE M.marketId = ?
  `;
    const [marketDataRows] = await database.execute(marketQuery, [marketId]);

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

    marketDataRows.forEach((row) => {
      marketDataObj.runners.push({
        id: row.id,
        runnerName: {
          runnerId: row.runnerId,
          name: row.runnerName,
          isWin: row.isWin,
          bal: Math.round(parseFloat(row.bal)),
        },
        rate: [
          {
            Back: row.BackRate,
            Lay: row.LayRate,
          },
        ],
      });
    });

    if (userId) {
      const orders = await currentOrder.findAll({
        where: {
          userId,
          marketId,
        },
      });

      orders.forEach((order) => {
        marketDataObj.data.runners.forEach((runner) => {
          if (order.type === 'Back') {
            if (String(runner.runnerName.runnerId) === String(order.runnerId)) {
              runner.runnerName.bal = Number(runner.runnerName.bal) + Number(order.bidAmount);
            } else {
              runner.runnerName.bal = Number(runner.runnerName.bal) - Number(order.value);
            }
          } else if (order.type === 'Lay') {
            if (String(runner.runnerName.runnerId) === String(order.runnerId)) {
              runner.runnerName.bal = Number(runner.runnerName.bal) - Number(order.bidAmount);
            } else {
              runner.runnerName.bal = Number(runner.runnerName.bal) + Number(order.value);
            }
          }
        });
      });

      const user = await userSchema.findByPk(userId);
      if (user) {
        let marketBalance = await MarketBalance.findAll({
          where: {
            userId,
            marketId,
          },
        });

        if (!marketBalance) {
          marketBalance = { marketId, runnerBalance: [] };
          user.marketBalance.push(marketBalance);
        }

        marketDataObj.data.runners.forEach((runner) => {
          const runnerId = runner.runnerName.runnerId.toString();
          const existingRunnerBalance = marketBalance.runnerBalance.find((balance) => balance.runnerId === runnerId);
          if (existingRunnerBalance) {
            existingRunnerBalance.bal = Number(runner.runnerName.bal);
            existingRunnerBalance.save();
          } else {
            MarketBalance.create({
              userId: user.id,
              marketId,
              runnerId,
              bal: Number(runner.runnerName.bal),
            });
          }
        });

        await user.save();
      }
    }

    return res.status(statusCode.success).send(marketDataObj);
  } catch (error) {
    res.status(statusCode.internalServerError).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? statusCode.internalServerError, error.errMessage ?? error.message));
  }
};
export const createBid = async (req, res) => {
  const { userId, gameId, marketId, runnerId, value, bidType, exposure, wallet, marketListExposure } = req.body;
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (value < 0) {
      throw new Error('Bid value cannot be negative');
    }

    const user = await userSchema.findOne({ where: { userId } });
    if (!user) {
      throw new Error('User Not Found');
    }
    if (user.balance < value) {
      throw new Error('Insufficient balance. Bid cannot be placed.');
    }

    const game = await Game.findOne({
      where: { gameId },
      include: {
        model: Market,
        as: 'Markets'
      }
    });
    if (!game) {
      throw new Error('Game Not Found');
    }

    const market = game.Markets.find(market => String(market.marketId) === String(marketId));
    if (!market) {
      throw new Error('Market Not Found');
    }

    const runner = await Runner.findOne({ where: { marketId, runnerId } });
    if (!runner) {
      throw new Error('Runner Not Found');
    }

    const gameName = game.gameName;
    const marketName = market.marketName;
    const runnerName = runner.runnerName;

    if (bidType === 'Back' || bidType === 'Lay') {
      const adjustedRate = runner[bidType] - 1;
      const mainValue = Math.round(adjustedRate * value);
      const betAmount = bidType === 'Back' ? value : mainValue;

      user.balance = wallet;
      user.exposure = exposure;
      user.marketListExposure = marketListExposure;

      const betHistoryEntry = {
        userId: userId,
        gameId: gameId,
        gameName: gameName,
        marketId: marketId,
        marketName: marketName,
        runnerId: runnerId,
        runnerName: runnerName,
        type: bidType,
        value: value,
        rate: runner[bidType],
        date: new Date(),
        bidAmount: mainValue,
        exposure: exposure,
      };

      await CurrentOrder.create(betHistoryEntry);
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
export const getUserBetHistory = async (req, res) => {
  try {
    const userId = req.user.id;
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

    res.status(statusCode.success).send(apiResponseSuccess({ rows, totalPages }, true, statusCode.success, 'Success'));
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
export const currentOrderHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const marketId = req.params.marketId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;

    if (!marketId) {
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, statusCode.badRequest, false, 'Market ID is required'));
    }

    const { count, rows } = await CurrentOrder.findAndCountAll({
      where: {
        userId,
        marketId,
      },
      attributes: ['runnerName', 'rate', 'value', 'type', 'bidAmount'],
      limit,
      offset: (page - 1) * limit,
    });

    const totalPages = Math.ceil(count / limit);

    res.status(statusCode.success).send(apiResponseSuccess({ rows, totalPages }, true, statusCode.success, 'Success'));
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
    const userId = req.user.id;
    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
    const startDate = req.query.startDate + ' 00:00:00';
    const endDate = req.query.endDate + ' 23:59:59';
    const query = `
      SELECT
        gameId,
        SUM(profitLoss) AS totalProfitLoss
      FROM ProfitLoss
      WHERE userId = ? AND date >= ? AND date <= ?
      GROUP BY gameId
    `;

    const parameters = [userId, startDate, endDate];
    const [rows] = await database.execute(query, parameters);

    if (rows.length === 0) {
      throw apiResponseErr(null, statusCode.notFound, false, 'No profit/loss data found for the given date range.');
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const profitLossData = rows.slice(startIndex, endIndex);
    const totalItems = rows.length;
    const totalPages = Math.ceil(totalItems / limit);

    const paginationData = {
      page: page,
      totalPages: totalPages,
      totalItems: totalItems,
    };

    return res
      .status(statusCode.success)
      .send(apiResponseSuccess(profitLossData, true, statusCode.success, 'Success', paginationData));
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
export const marketProfitLoss = async (req, res) => {
  try {
    const userId = req.user.id;
    const gameId = req.params.gameId;
    const { startDate, endDate } = req.query;

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);

    const query = `
    SELECT
    ProfitLoss.marketId,
    Market.marketName,
    SUM(ProfitLoss.profitLoss) AS totalProfitLoss
FROM ProfitLoss
JOIN Market ON ProfitLoss.marketId = Market.marketId
WHERE ProfitLoss.userId = ? AND ProfitLoss.gameId = ? AND ProfitLoss.date >= ? AND ProfitLoss.date <= ?
GROUP BY ProfitLoss.marketId

    `;

    const parameters = [userId, gameId, startDateObj, endDateObj];
    const [rows] = await database.execute(query, parameters);

    if (rows.length === 0) {
      throw apiResponseErr(null, false, statusCode.badRequest, 'No profit/loss data found for the given date range.');
    }

    const marketsProfitLoss = rows.map((row) => ({
      marketId: row.marketId,
      marketName: row.marketName,
      totalProfitLoss: row.totalProfitLoss,
    }));

    const totalItemsQuery = `
      SELECT COUNT(DISTINCT marketId) AS totalItems
      FROM ProfitLoss
      WHERE userId = ? AND gameId = ? AND date >= ? AND date <= ?
    `;
    const [totalItemsRows] = await database.execute(totalItemsQuery, [userId, gameId, startDateObj, endDateObj]);
    const totalItems = totalItemsRows[0].totalItems;

    return res
      .status(statusCode.success)
      .send(apiResponseSuccess({ marketsProfitLoss: marketsProfitLoss }, true, statusCode.success, 'Success'));
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
export const runnerProfitLoss = async (req, res) => {
  try {
    const userId = req.user.id;
    const marketId = req.params.marketId;
    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
    const { startDate, endDate } = req.query;

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);

    const query = `
      SELECT
          g.gameName,
          m.marketName,
          r.runnerName,
          r.runnerId,
          SUM(pl.profitLoss) AS totalProfitLoss
      FROM
          ProfitLoss pl
      JOIN
          Market m ON pl.marketId = m.marketId
      JOIN
          Runner r ON pl.runnerId = r.runnerId
      JOIN
          Game g ON pl.gameId = g.gameId
      WHERE
          pl.userId = ? AND
          pl.marketId = ? AND
          pl.date >= ? AND
          pl.date <= ?
      GROUP BY
          g.gameName, m.marketName, r.runnerName, r.runnerId
    `;

    const parameters = [userId, marketId, startDateObj, endDateObj];
    const [rows] = await database.execute(query, parameters);

    if (rows.length === 0) {
      throw apiResponseErr(null, false, statusCode.badRequest, 'No profit/loss data found for the given date range.');
    }

    const runnersProfitLoss = rows.map((row) => ({
      gameName: row.gameName,
      marketName: row.marketName,
      runnerName: row.runnerName,
      runnerId: row.runnerId,
      profitLoss: row.totalProfitLoss,
    }));

    return res
      .status(statusCode.success)
      .send(apiResponseSuccess({ runnersProfitLoss: runnersProfitLoss }, true, statusCode.success, 'Success'));
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
