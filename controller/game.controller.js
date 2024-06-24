import { apiResponseSuccess, apiResponseErr, apiResponsePagination } from '../middleware/serverError.js';
import { database } from '../controller/database.controller.js';
import { v4 as uuidv4 } from 'uuid';
import Game from '../models/game.model.js';
import { statusCode } from '../helper/statusCodes.js';
import { Op } from 'sequelize';
import Market from '../models/market.model.js';
import Runner from '../models/runner.model.js';
import rateSchema from '../models/rate.model.js';
import announcementSchema from '../models/announcement.model.js';

// done
export const createGame = async (req, res) => {
  const { gameName, description, isBlink } = req.body;
  try {
    const gameId = uuidv4();

    const existingGame = await Game.findOne({ where: { gameName } });

    if (existingGame) {
      return res
        .status(statusCode.badRequest)
        .json(apiResponseErr(null, false, statusCode.badRequest, 'Game name already exists'));
    }

    const newGame = await Game.create({
      gameId,
      gameName,
      description,
      isBlink,
    });

    return res
      .status(statusCode.create)
      .send(apiResponseSuccess(newGame, true, statusCode.create, 'Game created successfully'));
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
export const getAllGames = async (req, res) => {
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

    const gameData = await Promise.all(
      rows.map(async (game) => {
        const announcements = await announcementSchema.findAll({
          attributes: ['announceId', 'announcement'],
          where: {
            gameId: game.gameId,
          },
        });

        const formattedAnnouncements = announcements.map((announcement) => ({
          announceId: announcement.announceId,
          announcement: announcement.announcement,
        }));

        if (formattedAnnouncements.length === 0) {
          // Ensure the game is included even if there are no announcements
          return [
            {
              gameId: game.gameId,
              gameName: game.gameName,
              description: game.description,
              announceId: null,
              announcement: null,
            },
          ];
        }

        return formattedAnnouncements.map((announcement) => ({
          gameId: game.gameId,
          gameName: game.gameName,
          description: game.description,
          announceId: announcement.announceId,
          announcement: announcement.announcement,
        }));
      }),
    );

    const flattenedGameData = gameData.flat();

    const totalPages = Math.ceil(count / pageSize);
    const paginationData = apiResponsePagination(page, totalPages, count);

    const response = {
      games: flattenedGameData,
      pagination: paginationData,
    };

    return res.status(statusCode.success).json(apiResponseSuccess(response, true, statusCode.success, 'Success'));
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
export const updateGame = async (req, res) => {
  const { gameId, gameName, description } = req.body;
  try {
    const game = await Game.findOne({
      where: {
        gameId: gameId,
      },
    });

    if (!game) {
      return res
        .status(statusCode.notFound)
        .json(apiResponseErr(null, false, statusCode.badRequest, 'Game not found.'));
    }

    if (gameName) {
      game.gameName = gameName;
    }

    if (description !== undefined) {
      game.description = description;
    }

    await game.save();

    const updatedGame = await Game.findOne({
      where: {
        gameId: gameId,
      },
    });

    return res
      .status(statusCode.success)
      .json(apiResponseSuccess(updatedGame, true, statusCode.success, 'Game updated successfully.'));
  } catch (error) {
    console.error('Error updating game:', error);
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
export const createMarket = async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const { marketName, participants, timeSpan } = req.body;

    const existingMarket = await Market.findOne({
      where: {
        gameId: gameId,
        marketName: marketName,
      },
    });

    if (existingMarket) {
      return res
        .status(statusCode.badRequest)
        .json(apiResponseErr(existingMarket, false, statusCode.badRequest, 'Market already exists for this game'));
    }

    const game = await Game.findOne({
      where: {
        gameId: gameId,
      },
    });

    if (!game) {
      return res
        .status(statusCode.badRequest)
        .json(apiResponseErr(null, false, statusCode.badRequest, 'Game not found'));
    }

    const marketId = uuidv4();
    const newMarket = await Market.create({
      gameId: gameId,
      marketId: marketId,
      marketName: marketName,
      participants: participants,
      timeSpan: timeSpan,
      announcementResult: 0,
      isActive: 1,
      isDisplay: true,
    });

    // Fetch all markets for the game
    const marketList = await Market.findAll({
      where: {
        gameId: gameId,
      },
    });

    return res
      .status(statusCode.create)
      .json(apiResponseSuccess({ marketList: marketList }, true, statusCode.create, 'Market created successfully'));
  } catch (error) {
    console.error('Error creating market:', error);
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
export const getAllMarkets = async (req, res) => {
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
export const updateMarket = async (req, res) => {
  const { marketId, marketName, participants, timeSpan } = req.body;
  try {
    const market = await Market.findOne({
      where: {
        marketId: marketId,
      },
    });

    if (!market) {
      return res
        .status(statusCode.notFound)
        .json(apiResponseErr(null, false, statusCode.badRequest, 'Market not found.'));
    }

    const runners = await Runner.findAll({
      where: {
        marketId: marketId,
      },
    });

    for (const runner of runners) {
      await rateSchema.destroy({
        where: {
          runnerId: runner.runnerId,
        },
      });
    }

    await Runner.destroy({
      where: {
        marketId: marketId,
      },
    });

    if (marketName !== undefined) {
      market.marketName = marketName;
    }

    if (participants !== undefined) {
      market.participants = participants;
    }

    if (timeSpan !== undefined) {
      market.timeSpan = timeSpan;
    }

    await market.save();

    await Market.update(
      { isDisplay: true },
      {
        where: {
          marketId: marketId,
        },
      },
    );

    const updatedMarket = await Market.findOne({
      where: {
        marketId: marketId,
      },
    });

    return res
      .status(statusCode.success)
      .json(apiResponseSuccess(updatedMarket, true, statusCode.success, 'Market updated successfully.'));
  } catch (error) {
    console.error('Error updating market:', error);
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
export const createRunner = async (req, res) => {
  try {
    const marketId = req.params.marketId;
    const { runnerNames } = req.body;

    if (!runnerNames) {
      throw apiResponseErr(null, false, statusCode.badRequest, `RunnerName Required`);
    }

    const market = await Market.findOne({
      where: {
        marketId: marketId,
      },
    });

    if (!market) {
      throw apiResponseErr(null, false, statusCode.badRequest, 'Market Not Found');
    }

    const existingRunners = await Runner.findAll({
      attributes: ['runnerName'],
      where: {
        marketId: marketId,
      },
    });

    const existingRunnerNames = existingRunners.map((runner) => runner.runnerName.toLowerCase());

    for (const runnerName of runnerNames) {
      const lowerCaseRunnerName = runnerName.toLowerCase();
      if (existingRunnerNames.includes(lowerCaseRunnerName)) {
        throw apiResponseErr(null, false, statusCode.badRequest, `Runner already exists for this market`);
      }
    }

    const maxParticipants = market.participants;
    if (runnerNames.length !== maxParticipants) {
      throw apiResponseErr(
        null,
        false,
        statusCode.badRequest,
        'Number of runners exceeds the maximum allowed participants',
      );
    }

    const runnersToInsert = runnerNames.map((runnerName) => ({
      marketId: marketId,
      runnerId: uuidv4(),
      runnerName: runnerName,
      isWin: 0,
      bal: 0,
      back: null,
      lay: null,
    }));

    await Runner.bulkCreate(runnersToInsert);

    await Market.update(
      { isDisplay: false },
      {
        where: {
          marketId: marketId,
        },
      },
    );

    return res
      .status(statusCode.create)
      .send(apiResponseSuccess(null, true, statusCode.create, 'Runner created successfully'));
  } catch (error) {
    console.error('Error creating runner:', error);
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
export const updateRunner = async (req, res) => {
  try {
    const { runnerId, runnerName } = req.body;

    const [rowsAffected] = await Runner.update({ runnerName: runnerName }, { where: { runnerId: runnerId } });

    if (rowsAffected === 0) {
      return res
        .status(statusCode.notFound)
        .json(apiResponseErr(null, false, statusCode.notFound, 'Runner not found.'));
    }

    return res
      .status(statusCode.success)
      .json(apiResponseSuccess(null, true, statusCode.success, 'Runner updated successfully.'));
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
export const createRate = async (req, res) => {
  try {
    const runnerId = req.params.runnerId;
    const { back, lay } = req.body;

    const existingRunner = await Runner.findOne({
      where: { runnerId: runnerId }
    });

    if (!existingRunner) {
      throw new Error(`Runner with ID ${runnerId} not found.`);
    }

    let existingRate = await rateSchema.findOne({
      where: { runnerId: runnerId },
    });

    if (existingRate) {
      await existingRate.update({
        back: back,
        lay: lay,
      });
    } else {
      await rateSchema.create({
        runnerId: runnerId,
        back: back,
        lay: lay,
      });
    }

    await Runner.update({ back: back, lay: lay }, { where: { runnerId: runnerId } });

    return res
      .status(statusCode.create)
      .send(apiResponseSuccess(null, true, statusCode.create, 'Rate created or updated successfully'));
  } catch (error) {
    console.error('Error creating or updating rate:', error);
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
export const updateRate = async (req, res) => {
  try {
    const { runnerId, back, lay } = req.body;

    if (back === undefined && lay === undefined) {
      throw apiResponseErr(null, false, statusCode.badRequest, 'Either Back or Lay field is required for update.');
    }

    const runnerBeforeUpdate = await Runner.findOne({ where: { runnerId } });

    if (!runnerBeforeUpdate) {
      throw apiResponseErr(null, false, statusCode.notFound, 'Runner not found.');
    }

    const updateFields = {};

    if (back !== undefined && back !== parseFloat(runnerBeforeUpdate.back)) {
      updateFields.back = back;
    }

    if (lay !== undefined && lay !== parseFloat(runnerBeforeUpdate.lay)) {
      updateFields.lay = lay;
    }

    if (Object.keys(updateFields).length === 0) {
      return res
        .status(statusCode.success)
        .json(apiResponseSuccess(null, true, statusCode.success, 'No changes detected. Runner rate remains the same.'));
    }

    const [updatedRows] = await Runner.update(updateFields, {
      where: { runnerId },
    });

    if (updatedRows === 0) {
      throw apiResponseErr(null, false, statusCode.notFound, 'Runner not found.');
    }

    const runnerAfterUpdate = await Runner.findOne({ where: { runnerId } });
    console.log('Runner after update:', runnerAfterUpdate.toJSON());

    return res
      .status(statusCode.success)
      .json(apiResponseSuccess(null, true, statusCode.success, 'Rate updated successfully.'));
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
export const getAllRunners = async (req, res) => {
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
          Back: runner.back,
          Lay: runner.lay,
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
export const deleteGame = async (req, res) => {
  const gameId = req.params.gameId;
  try {
    if (!gameId) {
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, false, statusCode.badRequest, 'Game ID cannot be empty'));
    }

    const markets = await Market.findAll({
      where: {
        gameId: gameId,
      },
    });

    const marketIds = markets.map((market) => market.marketId);

    const runners = await Runner.findAll({
      where: {
        marketId: {
          [Op.in]: marketIds,
        },
      },
    });

    const runnerIds = runners.map((runner) => runner.runnerId);

    await rateSchema.destroy({
      where: {
        runnerId: {
          [Op.in]: runnerIds,
        },
      },
    });

    await Runner.destroy({
      where: {
        marketId: {
          [Op.in]: marketIds,
        },
      },
    });

    await Market.destroy({
      where: {
        gameId: gameId,
      },
    });

    await announcementSchema.destroy({
      where: {
        gameId: gameId,
      },
    });

    const deletedGameCount = await Game.destroy({
      where: {
        gameId: gameId,
      },
    });

    if (deletedGameCount === 0) {
      return res.status(statusCode.notFound).send(apiResponseErr(null, false, statusCode.notFound, 'Game not found'));
    }

    res
      .status(statusCode.success)
      .send(apiResponseSuccess(null, true, statusCode.success, 'Game deleted successfully'));
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
export const deleteMarket = async (req, res) => {
  try {
    const { marketId } = req.params;

    const runners = await Runner.findAll({
      where: {
        marketId: marketId,
      },
    });

    const runnerIds = runners.map((runner) => runner.runnerId);

    await rateSchema.destroy({
      where: {
        runnerId: {
          [Op.in]: runnerIds,
        },
      },
    });

    await Runner.destroy({
      where: {
        marketId: marketId,
      },
    });

    const deletedMarketCount = await Market.destroy({
      where: {
        marketId: marketId,
      },
    });

    if (deletedMarketCount === 0) {
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

    res
      .status(statusCode.success)
      .send(apiResponseSuccess(null, true, statusCode.success, 'Market deleted successfully'));
  } catch (error) {
    console.error('Error deleting market:', error);
    res
      .status(statusCode.internalServerError)
      .send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
};
// done
export const deleteRunner = async (req, res) => {
  try {
    const { runnerId } = req.params;

    await rateSchema.destroy({
      where: {
        runnerId: runnerId,
      },
    });

    const deletedRunnerCount = await Runner.destroy({
      where: {
        runnerId: runnerId,
      },
    });

    if (deletedRunnerCount === 0) {
      return res.status(statusCode.notFound).send(apiResponseErr(null, false, statusCode.notFound, 'Runner not found'));
    }

    res
      .status(statusCode.success)
      .send(apiResponseSuccess(null, true, statusCode.success, 'Runner deleted successfully'));
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
