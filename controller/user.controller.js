import { database } from '../controller/database.controller.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { apiResponseErr, apiResponsePagination, apiResponseSuccess } from '../middleware/serverError.js';
import moment from 'moment';
import { string } from '../constructor/string.js';
import userSchema from '../models/user.model.js';
import { v4 as uuidv4 } from 'uuid';
import { statusCode } from '../helper/statusCodes.js';

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

export const userGame = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
    const searchQuery = req.query.search || '';

    const fetchGameDataQuery = `
      SELECT gameId, gameName, description
      FROM Game
    `;
    const [fetchGameDataResult] = await database.execute(fetchGameDataQuery);

    if (!fetchGameDataResult || fetchGameDataResult.length === 0) {
      return res
        .status(statusCode.badRequest)
        .json(apiResponseErr(null, false, statusCode.badRequest, 'Data Not Found'));
    }

    const gameData = fetchGameDataResult.map((row) => ({
      gameId: row.gameId,
      gameName: row.gameName,
      description: row.description,
    }));

    const filteredGameData = gameData.filter(
      (game) => game.gameName && game.gameName.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const totalItems = filteredGameData.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    let paginatedGameData = [];
    if (page && pageSize) {
      paginatedGameData = filteredGameData.slice((page - 1) * pageSize, page * pageSize);
    } else {
      paginatedGameData = filteredGameData;
    }

    const paginationData = apiResponsePagination(page, totalPages, totalItems);
    return res
      .status(statusCode.success)
      .send(apiResponseSuccess(paginatedGameData, true, statusCode.success, 'Success', paginationData));
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
export const userMarket = async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const searchQuery = req.query.search ? req.query.search.toLowerCase() : '';

    const marketsQuery = `
      SELECT Market.marketId, Market.marketName, Market.timeSpan, Market.participants, Market.isActive
      FROM Market
      WHERE Market.gameId = ?
        AND LOWER(Market.marketName) LIKE CONCAT('%', ?, '%')
    `;

    const [markets] = await database.execute(marketsQuery, [gameId, searchQuery]);

    const totalItems = markets.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize;

    const paginatedMarkets = markets.slice(startIndex, endIndex);

    const paginationData = {
      currentPage: page,
      totalPages: totalPages,
      totalItems: totalItems,
    };

    return res
      .status(statusCode.success)
      .send(apiResponseSuccess(paginatedMarkets, true, statusCode.success, 'Success', paginationData));
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
export const userRunners = async (req, res) => {
  try {
    const marketId = req.params.marketId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const searchQuery = req.query.search || '';

    const runnersQuery = `
      SELECT Runner.runnerId, Runner.runnerName, Rate.Back, Rate.Lay
      FROM Runner
      LEFT JOIN Rate ON Runner.runnerId = Rate.runnerId
      WHERE Runner.marketId = ?
    `;
    const [runnersResult] = await database.execute(runnersQuery, [marketId]);

    const runners = runnersResult.map((row) => ({
      runnerId: row.runnerId,
      runnerName: row.runnerName,
      rates: [
        {
          Back: row.Back,
          Lay: row.Lay,
        },
      ],
    }));

    const filteredRunners = runners.filter((runner) =>
      runner.runnerName.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const totalItems = filteredRunners.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    const paginatedRunners = filteredRunners.slice((page - 1) * pageSize, page * pageSize);

    const paginationData = apiResponsePagination(page, totalPages, totalItems);

    res
      .status(statusCode.success)
      .send(apiResponseSuccess(paginatedRunners, true, statusCode.success, 'success', paginationData));
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
export const getAllGameData = async (req, res) => {
  try {
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
        R.Back AS BackRate,
        R.Lay AS LayRate
      FROM Game G
      LEFT JOIN Market M ON G.gameId = M.gameId
      LEFT JOIN Runner R ON M.marketId = R.marketId
    `;
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
              Back: row.BackRate,
              Lay: row.LayRate,
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
        RA.Back,
        RA.Lay
      FROM Game G
      LEFT JOIN Market M ON G.gameId = M.gameId
      LEFT JOIN Runner R ON M.marketId = R.marketId
      LEFT JOIN Rate RA ON R.runnerId = RA.runnerId
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
            Back: row.Back,
            Lay: row.Lay,
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
        R.Back AS BackRate,
        R.Lay AS LayRate
      FROM Market M
      LEFT JOIN Runner R ON M.marketId = R.marketId
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
      const currentOrdersQuery = `
        SELECT 
          type,
          runnerId,
          bidAmount,
          value
        FROM currentOrder
        WHERE userId = ? AND marketId = ?
      `;
      const [currentOrdersRows] = await database.execute(currentOrdersQuery, [userId, marketId]);

      const userMarketBalance = {
        userId: userId,
        marketId: marketId,
        runnerBalance: [],
      };

      marketDataObj.runners.forEach((runner) => {
        currentOrdersRows.forEach((order) => {
          if (order.type === 'Back') {
            if (String(runner.runnerName.runnerId) === String(order.runnerId)) {
              runner.runnerName.bal += Number(order.bidAmount);
            } else {
              runner.runnerName.bal -= Number(order.value);
            }
          } else if (order.type === 'Lay') {
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
        const userMarketBalanceQuery = `
          SELECT 
            userId,
            marketId,
            runnerId,
            bal
          FROM MarketBalance
          WHERE userId = ? AND marketId = ? AND runnerId = ?
        `;
        const [userMarketBalanceRows] = await database.execute(userMarketBalanceQuery, [
          userId,
          marketId,
          balance.runnerId,
        ]);

        if (userMarketBalanceRows.length > 0) {
          const updateUserMarketBalanceQuery = `
            UPDATE MarketBalance
            SET bal = ?
            WHERE userId = ? AND marketId = ? AND runnerId = ?
          `;
          await database.execute(updateUserMarketBalanceQuery, [balance.bal, userId, marketId, balance.runnerId]);
        } else {
          const insertUserMarketBalanceQuery = `
            INSERT INTO MarketBalance (userId, marketId, runnerId, bal)
            VALUES (?, ?, ?, ?)
          `;
          await database.execute(insertUserMarketBalanceQuery, [userId, marketId, balance.runnerId, balance.bal]);
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
// Not getting correct balance but exposure is done
export const createBid = async (req, res) => {
  const { userId, gameId, marketId, runnerId, value, bidType, exposure, wallet, marketListExposure } = req.body;
  try {
    if (!userId) throw apiResponseErr(null, false, statusCode.badRequest, 'User ID is required');
    if (value < 0) throw apiResponseErr(null, false, statusCode.badRequest, 'Bid value cannot be negative');

    const [balanceData] = await database.execute('SELECT ROUND(balance, 2) AS balance FROM User WHERE id = ?', [
      userId,
    ]);
    const userBalance = balanceData[0].balance;
    if (userBalance < value)
      throw apiResponseErr(null, false, statusCode.badRequest, 'Insufficient balance. Bid cannot be placed.');

    const [gameData] = await database.execute('SELECT * FROM Game WHERE gameId = ?', [gameId]);
    if (gameData.length === 0) throw apiResponseErr(null, false, statusCode.badRequest, 'Game not found');

    const [marketData] = await database.execute('SELECT * FROM Market WHERE marketId = ?', [marketId]);
    if (marketData.length === 0) throw apiResponseErr(null, false, statusCode.badRequest, 'Market not found');

    const [runnerData] = await database.execute('SELECT * FROM Runner WHERE runnerId = ?', [runnerId]);
    if (runnerData.length === 0) throw apiResponseErr(null, false, statusCode.badRequest, 'Runner not found');

    const adjustedRate = bidType === 'Back' ? runnerData[0].Back - 1 : runnerData[0].Lay - 1;
    const mainValue = Math.round(adjustedRate * value);
    const betAmount = bidType === 'Back' ? value : mainValue;

    const updateUserBalanceQuery = `
      UPDATE User SET balance = ?, exposure = ROUND(?, 2), marketListExposure = ? WHERE id = ?;
    `;
    const walletData = wallet !== undefined ? wallet : null;
    const exposureData = exposure !== undefined ? exposure : null;
    const marketListExposureData = marketListExposure !== undefined ? marketListExposure : null;
    await database.execute(updateUserBalanceQuery, [walletData, exposureData, marketListExposureData, userId]);

    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const insertCurrentOrderQuery = `
      INSERT INTO currentOrder (userId, gameId, gameName, marketId, marketName, runnerId, runnerName, type, value, rate, date, bidAmount, exposure) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    await database.execute(insertCurrentOrderQuery, [
      userId,
      gameId,
      gameData[0].gameName,
      marketId,
      marketData[0].marketName,
      runnerId,
      runnerData[0].runnerName,
      bidType,
      value,
      runnerData[0][bidType],
      currentDate,
      mainValue,
      exposure,
    ]);

    return res
      .status(statusCode.success)
      .send(apiResponseSuccess(null, true, statusCode.success, 'Bid placed successfully'));
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
export const getUserBetHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('userId', userId);
    const marketId = req.params.marketId;
    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
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

    let betHistoryQuery = `
      SELECT gameName, marketName, runnerName, rate, value, type, date
      FROM betHistory
      WHERE userId = ? AND marketId = ?`;

    const queryParams = [userId, marketId];

    if (start && end) {
      betHistoryQuery += ` AND date BETWEEN ? AND ?`;
      queryParams.push(start.format('YYYY-MM-DD HH:mm:ss'));
      queryParams.push(end.endOf('day').format('YYYY-MM-DD HH:mm:ss'));
    }

    const [rows] = await database.execute(betHistoryQuery, queryParams);

    const betDetails = rows.map((row) => ({
      gameName: row.gameName,
      marketName: row.marketName,
      runnerName: row.runnerName,
      rate: row.rate,
      value: row.value,
      type: row.type,
      date: row.date,
    }));
    res.status(statusCode.success).send(apiResponseSuccess(betDetails, true, statusCode.success, 'Success'));
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
    const { marketId } = req.params;

    if (!marketId) {
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, statusCode.badRequest, false, 'Market ID is required'));
    }

    const orderQuery = `
      SELECT runnerName, rate, value, type, bidAmount
      FROM currentOrder
      WHERE userId = ? AND marketId = ?;
    `;

    const [orders] = await database.execute(orderQuery, [userId, marketId]);

    if (orders.length === 0) {
      return res
        .status(statusCode.notFound)
        .send(apiResponseErr(null, statusCode.notFound, false, 'Orders not found for the specified user and market'));
    }

    const result = orders.map((order) => ({
      runnerName: order.runnerName,
      rate: order.rate,
      value: order.value,
      type: order.type,
      bidAmount: order.bidAmount,
    }));

    res.status(statusCode.success).send(apiResponseSuccess(result, true, statusCode.success, 'Success'));
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
