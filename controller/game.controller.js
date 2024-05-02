import { apiResponseSuccess, apiResponseErr, apiResponsePagination } from '../middleware/serverError.js';
import { database } from '../controller/database.controller.js'
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


    return res.status(201).send(apiResponseSuccess({ marketList: marketListResult }, true, 201, 'Market created successfully'));
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
// done
export const updateMarket = async (req, res) => {
  try {
    const { marketId, marketName, participants, timeSpan } = req.body;
    if (marketName === undefined && participants === undefined && timeSpan === undefined) {
      return res.status(400).json(apiResponseErr(null, false, 400, 'At least one field (marketName, participants, or timeSpan) is required.'));
    }

    let updateMarketQuery = 'UPDATE Market SET ';
    const updateParams = [];

    if (marketName !== undefined) {
      updateMarketQuery += 'marketName = ?, ';
      updateParams.push(marketName);
    }

    if (participants !== undefined) {
      updateMarketQuery += 'participants = ?, ';
      updateParams.push(participants);
    }

    if (timeSpan !== undefined) {
      updateMarketQuery += 'timeSpan = ?, ';
      updateParams.push(timeSpan);
    }

    updateMarketQuery = updateMarketQuery.slice(0, -2);

    updateMarketQuery += ' WHERE marketId = ?';
    updateParams.push(marketId);

    const [result] = await database.execute(updateMarketQuery, updateParams);
    const rowsAffected = result.affectedRows;

    if (rowsAffected === 0) {
      return res.status(404).json(apiResponseErr(null, false, 404, 'Market not found.'));
    }
    return res.status(200).json(apiResponseSuccess(null, true, 200, 'Market updated successfully.'));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// done
export const createRunner = async (req, res) => {
  try {
    const marketId = req.params.marketId;
    const { runnerNames } = req.body;

    if (!runnerNames) {
      throw apiResponseErr(null, false, 404, `RunnerName Required`);
    }

    const marketQuery = `
      SELECT *
      FROM Market
      WHERE marketId = ?
    `;

    const [marketResult] = await database.execute(marketQuery, [marketId]);
    const market = marketResult[0];
    if (!market) {
      throw apiResponseErr(null, false, 400, 'Market Not Found');
    }

    const existingRunnersQuery = `
      SELECT runnerName
      FROM Runner
      WHERE marketId = ?
    `;

    const [existingRunnersResult] = await database.execute(existingRunnersQuery, [marketId]);
    const existingRunners = existingRunnersResult.map(row => row.runnerName.toLowerCase());

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

    const insertRunnerQuery = `
      INSERT INTO Runner (marketId, runnerId, runnerName, isWin, bal)
      VALUES (?, ?, ?, ?, ?)
    `;
    const insertRunnerParams = [];
    for (const runnerName of runnerNames) {
      const runnerId = uuidv4();
      const bal = 0;
      insertRunnerParams.push([marketId, runnerId, runnerName, 0, bal]);
    }
    await Promise.all(insertRunnerParams.map(params => database.execute(insertRunnerQuery, params)));

    return res.status(201).send(apiResponseSuccess(null, true, 201, 'Runner created successfully'));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// done
export const updateRunner = async (req, res) => {
  try {
    const { runnerId, runnerName } = req.body;
    const updateRunnerQuery = `
      UPDATE Runner
      SET runnerName = ?
      WHERE runnerId = ?
    `;

    const [result] = await database.execute(updateRunnerQuery, [runnerName, runnerId]);
    const rowsAffected = result.affectedRows;

    if (rowsAffected === 0) {
      return res.status(404).json(apiResponseErr(null, false, 404, 'Runner not found.'));
    }

    return res.status(200).json(apiResponseSuccess(null, true, 200, 'Runner updated successfully.'));
  } catch (error) {
    // Handle errors
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// done
export const createRate = async (req, res) => {
  try {
    const runnerId = req.params.runnerId;
    const { back, lay } = req.body;
    const existingRateQuery = `
      SELECT COUNT(*) AS count
      FROM Rate
      WHERE runnerId = ?
    `;
    const [existingRateResult] = await database.execute(existingRateQuery, [runnerId]);
    const rateExists = existingRateResult[0].count > 0;

    if (rateExists) {
      const updateRateQuery = `
        UPDATE Rate
        SET Back = ?, Lay = ?
        WHERE runnerId = ?
      `;
      await database.execute(updateRateQuery, [back, lay, runnerId]);
    } else {
      const insertRateQuery = `
        INSERT INTO Rate (runnerId, Back, Lay)
        VALUES (?, ?, ?)
      `;
      await database.execute(insertRateQuery, [runnerId, back, lay]);
    }

    const updateRunnerQuery = `
      UPDATE Runner
      SET Back = ?, Lay = ?
      WHERE runnerId = ?
    `;
    await database.execute(updateRunnerQuery, [back, lay, runnerId]);

    return res.status(201).send(apiResponseSuccess(null, true, 201, 'Rate created successfully'));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// done
export const updateRate = async (req, res) => {
  try {
    const { runnerId, back, lay } = req.body;

    if (back === undefined && lay === undefined) {
      throw apiResponseErr(null, false, 400, 'Either Back or Lay field is required for update.');
    }

    const updateFields = [];
    const updateValues = [];

    if (back !== undefined) {
      updateFields.push('Back = ?');
      updateValues.push(back);
    }

    if (lay !== undefined) {
      updateFields.push('Lay = ?');
      updateValues.push(lay);
    }

    const updateRateQuery = `
      UPDATE Runner
      SET ${updateFields.join(', ')}
      WHERE runnerId = ?;
    `;
    const queryParams = [...updateValues, runnerId];

    await database.execute(updateRateQuery, queryParams);

    return res.status(200).json(apiResponseSuccess(null, true, 200, 'Rate updated successfully.'));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// done
export const getAllRunners = async (req, res) => {
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



