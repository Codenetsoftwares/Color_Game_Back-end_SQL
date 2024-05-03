import { database } from '../controller/database.controller.js'
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import { apiResponseErr, apiResponsePagination, apiResponseSuccess } from '../middleware/serverError.js';
import moment from 'moment';

export const loginUser = async (req, res) => {
  try {
    const { userName, password } = req.body;
    console.log("req", req.body)
    if (!userName || !password) {
      return res.status(400).send(apiResponseErr(null, false, 400, 'Required'));
    }

    const [rows] = await database.execute('SELECT * FROM User WHERE userName = ?', [userName]);
    const existingUser = rows[0];

    if (!existingUser || !existingUser.password) {
      return res.status(401).send(apiResponseErr(null, false, 401, 'User not found'));
    }
    console.log("existingUser.password", existingUser.password)
    console.log("pass", password)
    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    console.log('isPassword', isPasswordValid)

    if (!isPasswordValid) {
      return res.status(401).send(apiResponseErr(null, false, 401, 'Invalid username or password..'));
    }

    const accessTokenResponse = {
      id: existingUser.id,
      userName: existingUser.userName,
      isEighteen: existingUser.eligibilityCheck,
      UserType: existingUser.userType || 'User',
      wallet: existingUser.wallet
    };

    const accessToken = jwt.sign(accessTokenResponse, process.env.JWT_SECRET_KEY, {
      expiresIn: '1d',
    });

    res.status(200).send(apiResponseSuccess({
      accessToken, id: existingUser.id,
      userName: existingUser.userName,
      isEighteen: existingUser.eligibilityCheck,
      UserType: existingUser.userType || 'User',
      wallet: existingUser.wallet
    }, true, 200, 'Login successful'));

  } catch (error) {
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};

export const eligibilityCheck = async (req, res) => {
  try {
    const id = req.params.userId;
    const { eligibilityCheck } = req.body;

    const userQuery = 'SELECT * FROM User WHERE id = ?';
    const [user] = await database.execute(userQuery, [id]);

    if (!user) {
      return res.status(400).send(apiResponseErr(null, false, 400, 'User not found'));
    }

    const updateQuery = 'UPDATE User SET eligibilityCheck = ? WHERE id = ?';
    const [updatedRows] = await database.execute(updateQuery, [eligibilityCheck ? 1 : 0, id]);

    if (updatedRows.affectedRows > 0) {
      return res.status(200).send({
        message: eligibilityCheck ? 'User Eligible' : 'User Not Eligible',
      });
    } else {
      return res.status(400).send(apiResponseErr(null, false, 400, 'Failed to update user eligibility'));
    }
  } catch (error) {
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { oldPassword, password, confirmPassword } = req.body;
    const userId = req.user[0].id;
    const [userRows] = await database.execute('SELECT * FROM User WHERE id = ?', [userId]);
    const user = userRows[0];
    if (!user) {
      return res.status(404).send(apiResponseErr(null, false, 401, 'User Not Found'));
    }
    const oldPasswordIsCorrect = await bcrypt.compare(oldPassword, user.password);
    if (!oldPasswordIsCorrect) {
      return res.status(400).send(apiResponseErr(null, false, 401, 'Invalid old password'));
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    await database.execute('UPDATE User SET password = ? WHERE id = ?', [hashedPassword, userId]);
    res.status(200).send(apiResponseSuccess(user, true, 200, 'Password Reset Successfully'));
  } catch (error) {
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
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
      return res.status(400).json(apiResponseErr(null, false, 400, 'Data Not Found'));
    }

    const gameData = fetchGameDataResult.map(row => ({
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
    return res.status(200).send(apiResponseSuccess(paginatedGameData, true, 200, 'Success', paginationData));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
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
      totalItems: totalItems
    };

    return res.status(200).send(apiResponseSuccess(paginatedMarkets, true, 200, 'Success', paginationData));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};

export const userRunners = async (req, res) => {
  try {
    const marketId = req.params.marketId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const searchQuery = req.query.search || '';

    const runnersQuery = `
      SELECT Runner.*, Rate.Back, Rate.Lay
      FROM Runner
      LEFT JOIN Rate ON Runner.runnerId = Rate.runnerId
      WHERE Runner.marketId = ?
    `;
    const [runnersResult] = await database.execute(runnersQuery, [marketId]);

    const runners = runnersResult.map(row => ({
      runnerId: row.runnerId,
      runnerName: row.runnerName,
      isWin: row.isWin,
      back: row.Back,
      lay: row.Lay,
    }));

    const filteredRunners = runners.filter(runner =>
      runner.runnerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalItems = filteredRunners.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    const paginatedRunners = filteredRunners.slice((page - 1) * pageSize, page * pageSize);

    const paginationData = apiResponsePagination(page, totalPages, totalItems);

    res.status(200).send(apiResponseSuccess(paginatedRunners, true, 200, 'success', paginationData));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};

export const getAllGameData = async (req, res) => {
  try {
    const gameDataQuery = `
      SELECT
        G.gameId,
        G.gameName,
        G.description,
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
        R.Back,
        R.Lay
      FROM Game G
      LEFT JOIN Market M ON G.gameId = M.gameId
      LEFT JOIN Runner R ON M.marketId = R.marketId
    `;
    const [gameDataRows] = await database.execute(gameDataQuery);

    const allGameData = gameDataRows.reduce((acc, row) => {
      let gameIndex = acc.findIndex(game => game.gameId === row.gameId);
      if (gameIndex === -1) {
        acc.push({
          gameId: row.gameId,
          gameName: row.gameName,
          description: row.description,
          markets: []
        });
        gameIndex = acc.length - 1;
      }

      let marketIndex = acc[gameIndex].markets.findIndex(market => market.marketId === row.marketId);
      if (marketIndex === -1) {
        acc[gameIndex].markets.push({
          marketId: row.marketId,
          marketName: row.marketName,
          participants: row.participants,
          timeSpan: row.timeSpan,
          announcementResult: row.announcementResult,
          isActive: row.isActive,
          runners: []
        });
        marketIndex = acc[gameIndex].markets.length - 1;
      }
      if (row.runnerId) {
        acc[gameIndex].markets[marketIndex].runners.push({
          runnerId: row.runnerId,
          runnerName: row.runnerName,
          isWin: row.isWin,
          bal: row.bal,
          Back: row.Back,
          Lay: row.Lay
        });
      }

      return acc;
    }, []);


    res.status(200).send(apiResponseSuccess(allGameData, true, 200, 'Success'));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
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
      throw apiResponseErr(null, false, 400, 'Game not found');
    }
    const { gameName, description } = gameDataRows[0];
    const gameData = gameDataRows.reduce((acc, row) => {
      if (!acc.gameId) {
        acc.gameId = row.gameId;
        acc.gameName = gameName;
        acc.description = description;
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
          runners: []
        };
      }
      acc.markets[row.marketId].runners.push({
        runnerId: row.runnerId,
        runnerName: row.runnerName,
        isWin: row.isWin,
        bal: row.bal,
        Back: row.Back,
        Lay: row.Lay
      });

      return acc;
    }, {});
    const marketsArray = Object.values(gameData.markets);
    res.status(200).send(apiResponseSuccess({ gameId, gameName, description, markets: marketsArray }, true, 200, 'Success'));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};

export const getAnnouncementUser = async (req, res) => {
  try {
    const announceId = req.params.announceId;
    const announceIdString = String(announceId);
    const announcementQuery = `
      SELECT *
      FROM Announcement
      WHERE announceId = ?
    `;
    const [announcementData] = await database.execute(announcementQuery, [announceIdString]);

    if (announcementData.length === 0) {
      throw apiResponseErr(null, false, 400, 'Announcement not found');
    }
    const latestAnnouncement = announcementData.reduce((latest, current) => {
      if (latest.announceId < current.announceId) {
        return current;
      }
      return latest;
    });
    res.status(200).send(apiResponseSuccess({
      announcementId: latestAnnouncement.announceId,
      typeOfAnnouncement: latestAnnouncement.typeOfAnnouncement,
      announcement: [latestAnnouncement.announcement],
    }, true, 200, 'success'));

  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};

export const getAnnouncementTypes = async (req, res) => {
  try {
    const announcementTypesQuery = `
      SELECT announceId, typeOfAnnouncement
      FROM Announcement
    `;
    const [announcementTypesData] = await database.execute(announcementTypesQuery);
    const announcementTypes = announcementTypesData.map((announcement) => ({
      announceId: announcement.announceId,
      typeOfAnnouncement: announcement.typeOfAnnouncement,
    }));
    res.status(200).send(apiResponseSuccess(announcementTypes, true, 200, 'Success'));

  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
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

    res.status(200).send(apiResponseSuccess(formattedGif, true, 200));

  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
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
      return res.status(404).send(apiResponseErr(null, false, 404, 'User not found'));
    }

    const getBalance = {
      walletId: userData[0].walletId,
      balance: userData[0].balance,
      exposure: userData[0].exposure,
      marketListExposure: userData[0].marketListExposure,
    };

    res.status(200).send(apiResponseSuccess(getBalance, true, 200, 'success'));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
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
      throw apiResponseErr(null, 400, false, 'User Not Found or No Transactions Found');
    }

    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, transactionData.length);

    const paginatedDetails = transactionData.slice(startIndex, endIndex);

    const totalItems = transactionData.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginationData = apiResponsePagination(page, totalPages, totalItems);

    res.status(200).send(apiResponseSuccess(paginatedDetails, true, 200, 'Success', paginationData));
  } catch (error) {
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// pending
export const filterMarketData = async (req, res) => {
  try {
    const marketId = req.params.marketId;
    const userId = req.body?.userId;

    const marketQuery = `
      SELECT m.*, r.runnerId, r.runnerName, r.bal
      FROM Market m
      LEFT JOIN Runner r ON m.marketId = r.marketId
      WHERE m.marketId = ?;
    `;
    const [marketData] = await database.execute(marketQuery, [marketId]);

    if (marketData.length === 0) {
      throw apiResponseErr(null, false, 400, 'Market not found with MarketId');
    }

    let marketDataObj = {
      marketId: marketData[0].marketId,
      marketName: marketData[0].marketName,
      participants: marketData[0].participants,
      timeSpan: marketData[0].timeSpan,
      announcementResult: marketData[0].announcementResult,
      isActive: marketData[0].isActive,
      runners: marketData.map((runner) => ({
        runnerName: {
          runnerId: runner.runnerId,
          name: runner.runnerName,
          isWin: runner.isWin,
          bal: runner.bal
        },
        rate: runner.rate,
        _id: runner._id
      })),
      _id: marketData[0]._id
    };

    if (userId) {
      const currentOrdersQuery = `
        SELECT *
        FROM currentOrder
        WHERE userId = ? AND marketId = ?;
      `;
      const [currentOrders] = await database.execute(currentOrdersQuery, [userId, marketId]);

      if (currentOrders.length > 0) {
        marketDataObj.runners.forEach((runner) => {
          currentOrders.forEach((order) => {
            if (order.type === 'Back') {
              if (String(runner.runnerId) === String(order.runnerId)) {
                runner.runnerName.bal += Number(order.bidAmount);
              } else {
                runner.runnerName.bal -= Number(order.value);
              }
            } else if (order.type === 'Lay') {
              if (String(runner.runnerId) === String(order.runnerId)) {
                runner.runnerName.bal -= Number(order.bidAmount);
              } else {
                runner.runnerName.bal += Number(order.value);
              }
            }
          });
        });

        const totalMarketBalance = marketDataObj.runners.reduce((total, runner) => total + runner.runnerName.bal, 0);

        const updateUserBalanceQuery = `
          UPDATE MarketBalance
          SET bal = ?
          WHERE userId = ? AND marketId = ?;
        `;
        await database.execute(updateUserBalanceQuery, [totalMarketBalance, userId, marketId]);
      }
    }

    return res.status(200).send(apiResponseSuccess(marketDataObj, true, 200, 'Success'));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// test from frontend after fixing frontend
export const createBid = async (req, res) => {
  const { userId, gameId, marketId, runnerId, value, bidType, exposure, wallet, marketListExposure } = req.body;
  try {
    if (!userId) throw apiResponseErr(null, 400, false, 'User ID is required');

    if (value < 0) throw apiResponseErr(null, 400, false, 'Bid value cannot be negative');

    const userQuery = `
      SELECT * FROM User WHERE id = ? AND balance >= ?;
    `;

    const [userData] = await database.execute(userQuery, [userId, value]);
    if (userData.length === 0) throw apiResponseErr(null, 400, false, 'User not found or insufficient balance');

    const gameQuery = `
      SELECT * FROM Game WHERE gameId = ?;
    `;

    const [gameData] = await database.execute(gameQuery, [gameId]);
    if (gameData.length === 0) throw apiResponseErr(null, 400, false, 'Game not found');

    const marketQuery = `
      SELECT * FROM Market WHERE marketId = ?;
    `;
    const [marketData] = await database.execute(marketQuery, [marketId]);
    if (marketData.length === 0) throw apiResponseErr(null, 400, false, 'Market not found');

    const runnerQuery = `
      SELECT * FROM Runner WHERE runnerId = ?;
    `;
    const [runnerData] = await database.execute(runnerQuery, [runnerId]);
    if (runnerData.length === 0) throw apiResponseErr(null, 400, false, 'Runner not found');

    const adjustedRate = bidType === 'Back' ? runnerData[0].Back - 1 : runnerData[0].Lay - 1;
    const mainValue = Math.round(adjustedRate * value);
    const betAmount = bidType === 'Back' ? value : mainValue;

    const updateUserBalanceQuery = `
      UPDATE User SET balance = balance - ?, exposure = ?, marketListExposure = ? WHERE id = ?;
    `;

    const walletParam = wallet !== undefined ? wallet : null;
    const exposureParam = exposure !== undefined ? exposure : null;
    const marketListExposureParam = marketListExposure !== undefined ? marketListExposure : null;

    await database.execute(updateUserBalanceQuery, [walletParam, exposureParam, marketListExposureParam, userId]);

    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const insertCurrentOrderQuery = `
      INSERT INTO currentOrder (userId, gameId, gameName, marketId, marketName, runnerId, runnerName, rate, value, type, date, bidAmount, isWin, profitLoss) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    await database.execute(insertCurrentOrderQuery, [userId, gameId, gameData[0].gameName, marketId, marketData[0].marketName, runnerId, runnerData[0].runnerName, adjustedRate, value, bidType, currentDate, mainValue, 0, 0]);
    return res.status(200).send(apiResponseSuccess(null, true, 200, 'Bid placed successfully'));

  } catch (error) {
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// done
export const getUserBetHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("userId", userId)
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

    const betDetails = rows.map(row => ({
      gameName: row.gameName,
      marketName: row.marketName,
      runnerName: row.runnerName,
      rate: row.rate,
      value: row.value,
      type: row.type,
      date: row.date
    }));
    res.status(200).send(apiResponseSuccess(betDetails, true, 200, 'Success'));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.successCode ?? 500, error.errMessage ?? error.message));
  }
};


