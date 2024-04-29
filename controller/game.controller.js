import { apiResponseSuccess, apiResponseErr, apiResponsePagination } from '../middleware/serverError.js';
import { database } from '../controller/database.controller.js'
import mongoose, { set } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// done
export const createGame = async (req, res) => {
  const { gameName, description, isBlink } = req.body;
  try {

    const gameId = uuidv4();

    const existingGameQuery = 'SELECT * FROM Game WHERE gameName = ?';
    const [existingGameResult] = await database.execute(existingGameQuery, [gameName]);

    if (existingGameResult.length > 0) {
      return res.status(400).json(apiResponseErr(null, false, 400, 'Game name already exists'));
    }

    const insertGameQuery = `
      INSERT INTO Game (gameId, gameName, description, isBlink)
      VALUES (?, ?, ?, ?)
    `;
    await database.execute(insertGameQuery, [gameId, gameName, description, isBlink]);

    const newGameQuery = 'SELECT * FROM Game WHERE gameId = ?';
    const [newGameResult] = await database.execute(newGameQuery, [gameId]);
    const newGame = newGameResult[0];

    return res.status(201).send(apiResponseSuccess(newGame, true, 201, 'Game created successfully'));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// done
export const getAllGames = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
    const searchQuery = req.query.search || '';

    const fetchGameDataQuery = `
    SELECT G.gameId, G.gameName, G.description, A.announcementId, A.announcement
    FROM Game G
    LEFT JOIN Announcement A ON G.gameId = A.gameId    
    `;
    const [fetchGameDataResult] = await database.execute(fetchGameDataQuery);

    if (!fetchGameDataResult || fetchGameDataResult.length === 0) {
      return res.status(400).json(apiResponseErr(null, false, 400, 'Data Not Found'));
    }

    const gameData = [];
    for (const row of fetchGameDataResult) {
      const gameIndex = gameData.findIndex((game) => game.gameId === row.gameId);
      if (gameIndex === -1) {
        gameData.push({
          gameId: row.gameId,
          gameName: row.gameName,
          description: row.description,
          announcements: [],
        });
      }
      if (row.announcementId) {
        const announcement = {
          announcementId: row.announcementId,
          announcementText: row.announcementText,
        };
        gameData[gameIndex].announcements.push(announcement);
      }
    }

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
    return res.status(200).json(apiResponseSuccess(paginatedGameData, true, 200, 'Success', paginationData));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// done
export const updateGame = async (req, res) => {
  const { gameId, gameName, description } = req.body;
  try {
    const updateGameQuery = `
      UPDATE Game
      SET gameName = ?${description ? ', description = ?' : ''}
      WHERE gameId = ?
    `;

    const queryParams = [gameName];
    if (description) {
      queryParams.push(description);
    }
    queryParams.push(gameId);

    await database.execute(updateGameQuery, queryParams);

    const getUpdatedGameQuery = 'SELECT * FROM Game WHERE gameId = ?';
    const [updatedGameResult] = await database.execute(getUpdatedGameQuery, [gameId]);
    const updatedGame = updatedGameResult[0];

    if (!updatedGame) {
      return res.status(404).json(apiResponseErr(null, false, 404, 'Game not found.'));
    }

    return res.status(200).json(apiResponseSuccess(updatedGame, true, 200, 'Game updated successfully.'));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// done
export const createMarket = async (req, res) => {
  try {
    const gameId = req.params.gameId; 
    const { marketName, participants, timeSpan } = req.body;

    const existingMarketQuery = 'SELECT * FROM Market WHERE gameId = ? AND marketName = ?';
    const [existingMarketResult] = await database.execute(existingMarketQuery, [gameId, marketName]);
    if (existingMarketResult.length > 0) {
      return res.status(400).json(apiResponseErr(existingMarketResult, false, 400, 'Market already exists for this game'));
    }

    const gameQuery = 'SELECT * FROM Game WHERE gameId = ?';
    const [gameResult] = await database.execute(gameQuery, [gameId]);
    const game = gameResult[0];

    if (!game) {
      return res.status(400).json(apiResponseErr(null, false, 400, 'Game not found'));
    }

    const insertMarketQuery = `
      INSERT INTO Market (gameId, marketId, marketName, participants, timeSpan)
      VALUES (?, ?, ?, ?, ?)
    `;
    const marketId = uuidv4();
    await database.execute(insertMarketQuery, [gameId, marketId, marketName, participants, timeSpan]);

    const marketListQuery = 'SELECT * FROM Market WHERE gameId = ?';
    const [marketListResult] = await database.execute(marketListQuery, [gameId]);


    return res.status(201).send(apiResponseSuccess({marketList: marketListResult }, true, 201, 'Market created successfully'));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// done
export const getAllMarkets = async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const searchQuery = req.query.search || '';

    const fetchMarketsQuery = `
      SELECT M.marketId, M.marketName, M.participants, M.timeSpan
      FROM Market M
      WHERE M.gameId = ? AND LOWER(M.marketName) LIKE ?
    `;
    const [marketsResult] = await database.execute(fetchMarketsQuery, [gameId, `%${searchQuery.toLowerCase()}%`]);

    const totalItems = marketsResult.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const paginatedMarkets = marketsResult.slice(startIndex, endIndex);

    const paginationData = {
      page,
      totalPages,
      totalItems,
    };

    return res.status(200).json(apiResponseSuccess(paginatedMarkets, true, 200, 'Success', paginationData));
  } catch (error) {
    res.status(500).json(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};



export const updateMarket = async (req, res) => {
  const { marketId, marketName, participants, timeSpan } = req.body;

  try {
    const updatedAdmin = await Admin.findOneAndUpdate(
      { 'gameList.markets.marketId': marketId },
      {
        $set: {
          'gameList.$.markets.$[market].marketName': marketName,
          'gameList.$.markets.$[market].participants': participants,
          'gameList.$.markets.$[market].timeSpan': timeSpan,
        },
      },
      {
        new: true,
        arrayFilters: [{ 'market.marketId': marketId }],
      },
    );

    if (!updatedAdmin) {
      return res.status(404).json(apiResponseErr(null, false, 404, 'Market not found.'));
    }

    return res.status(200).json(apiResponseSuccess(updatedAdmin, true, 200, 'Market updated successfully.'));
  } catch (error) {
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
export const createRunner = async (req, res) => {
  const marketId = req.params.marketId;
  const { runnerNames } = req.body;
  try {
    if (!runnerNames) {
      throw apiResponseErr(null, false, 404, `RunnerName Required`);
    }
    const runner = await Admin.findOne(stringConstructor.StringConst);
    if (!runner) {
      throw apiResponseErr(null, false, 400, 'Admin not found');
    }
    const market = runner.gameList.reduce((acc, game) => {
      return acc || game.markets.find((market) => String(market.marketId) === String(marketId));
    }, null);

    if (!market) {
      throw apiResponseErr(null, false, 400, 'Market Not Found');
    }

    const existingRunners = market.runners.map(
      (runner) => runner.runnerName.name && runner.runnerName.name.toLowerCase(),
    );
    for (const runnerName of runnerNames) {
      const lowerCaseRunnerName = runnerName.toLowerCase();
      if (existingRunners.includes(lowerCaseRunnerName)) {
        throw apiResponseErr(null, false, 400, `Runner already exists for this market`);
      }
    }
    const maxParticipants = market.participants;
    if (runnerNames.length !== maxParticipants) {
      throw apiResponseErr(null, false, 400, 'Number of runners exceeds the maximum allowed participants');
    }
    const newRunners = runnerNames.map((runnerName) => {
      const runnerId = new mongoose.Types.ObjectId();
      const name = runnerName;
      return {
        runnerName: { runnerId, name },
        rate: {
          Back: '',
          Lay: '',
        },
      };
    });
    market.runners.push(...newRunners);
    await runner.save();
    return res
      .status(201)
      .send(apiResponseSuccess({ gameList: runner.gameList }, true, 201, 'Runner created successfully'));
  } catch (error) {
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
export const updateRunner = async (req, res) => {
  const { runnerId, runnerName } = req.body;

  try {
    const updatedAdmin = await Admin.findOneAndUpdate(
      { 'gameList.markets.runners.runnerName.runnerId': runnerId },
      {
        $set: {
          'gameList.$[game].markets.$[market].runners.$[runner].runnerName.name': runnerName,
        },
      },
      {
        new: true,
        arrayFilters: [
          { 'game.markets.runners.runnerName.runnerId': runnerId },
          { 'market.runners.runnerName.runnerId': runnerId },
          { 'runner.runnerName.runnerId': runnerId },
        ],
      },
    );

    if (!updatedAdmin) return res.status(404).json(apiResponseErr(null, false, 404, 'Runner not found.'));

    return res.status(200).json(apiResponseSuccess(updatedAdmin, true, 200, 'Runner updated successfully.'));
  } catch (error) {
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
export const createRate = async (req, res) => {
  const runnerId = req.params.runnerId;
  const { back, lay } = req.body;
  try {
    const runnerObj = await Admin.findOneAndUpdate(
      { 'gameList.markets.runners.runnerName.runnerId': runnerId },
      {
        $set: {
          'gameList.$[game].markets.$[market].runners.$[runner].rate.0.Back': back,
          'gameList.$[game].markets.$[market].runners.$[runner].rate.0.Lay': lay,
        },
      },
      {
        new: true,
        arrayFilters: [
          { 'game.gameId': { $exists: true } },
          { 'market.marketId': { $exists: true } },
          { 'runner.runnerName.runnerId': runnerId },
        ],
      },
    );
    if (!runnerObj) {
      throw apiResponseErr(null, false, 400, `Runner not found`);
    }

    return res
      .status(201)
      .send(apiResponseSuccess({ gameList: runnerObj.gameList }, true, 201, 'Rate created successfully'));
  } catch (error) {
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
export const updateRate = async (req, res) => {
  const { runnerId, back, lay } = req.body;

  try {
    const updatedAdmin = await Admin.findOneAndUpdate(
      { 'gameList.markets.runners.runnerName.runnerId': runnerId },
      {
        $set: {
          'gameList.$[game].markets.$[market].runners.$[runner].rate.0.Back': back,
          'gameList.$[game].markets.$[market].runners.$[runner].rate.0.Lay': lay,
        },
      },
      {
        new: true,
        arrayFilters: [
          { 'game.markets.runners.runnerName.runnerId': runnerId },
          { 'market.runners.runnerName.runnerId': runnerId },
          { 'runner.runnerName.runnerId': runnerId },
        ],
      },
    );

    if (!updatedAdmin) return res.status(404).json(apiResponseErr(null, false, 404, 'Runner not found.'));
    return res.status(200).json(apiResponseSuccess(updatedAdmin, true, 200, 'Rate updated successfully.'));
  } catch (error) {
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
export const getAllRunners = async (req, res) => {
  try {
    const marketId = new mongoose.Types.ObjectId(req.params.marketId);
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const searchQuery = req.query.search || '';

    const admin = await Admin.findOne({ 'gameList.markets.marketId': marketId });

    if (!admin || !admin.gameList || admin.gameList.length === 0) {
      throw apiResponseErr(null, true, 400, 'Market not found for the specified Admin');
    }

    let runnerData = [];
    let totalItems = 0;

    admin.gameList.forEach((game) => {
      const market = game.markets.find((m) => m.marketId.equals(marketId));
      if (market) {
        const filteredRunners = market.runners.filter(
          (runner) =>
            runner.runnerName.name && runner.runnerName.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );

        totalItems += filteredRunners.length;

        const paginatedRunners = filteredRunners.slice((page - 1) * pageSize, page * pageSize);

        paginatedRunners.forEach((runner) => {
          runnerData.push({
            runnerId: runner.runnerName.runnerId,
            runnerName: runner.runnerName.name,
            isWin: runner.runnerName.isWin,
            rates: runner.rate.map((rate) => ({
              Back: rate.Back,
              Lay: rate.Lay,
            })),
          });
        });
      }
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    const paginationData = apiResponsePagination(page, totalPages, totalItems);

    res.status(200).send(apiResponseSuccess(runnerData, true, 200, 'success', paginationData));
  } catch (error) {
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};

