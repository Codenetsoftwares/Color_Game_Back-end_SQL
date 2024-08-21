import { Sequelize } from "sequelize";
import { statusCode } from "../helper/statusCodes.js";
import {
  apiResponseErr,
  apiResponseSuccess,
} from "../middleware/serverError.js";
import Game from "../models/game.model.js";
import Market from "../models/market.model.js";
import Runner from "../models/runner.model.js";


export const getInactiveGames = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      search = ''
    } = req.query;

    const searchQuery = String(search);

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize, 10);

    // Fetch winning runners
    const winningRunners = await Runner.findAll({
      where: { isWin: true },
      attributes: ["runnerId", "marketId"],
    });

    if (winningRunners.length === 0) {
      return res
        .status(statusCode.success)
        .json(apiResponseSuccess([], true, statusCode.success, "No winning runners found"));
    }

    const marketIds = [...new Set(winningRunners.map(runner => runner.marketId))];

    // Fetch all markets with winning runners
    const { count: totalMarkets, rows: markets } = await Market.findAndCountAll({
      where: {
        marketId: marketIds,
        marketName: {
          [Sequelize.Op.like]: `%${searchQuery}%`
        }
      },
      attributes: [
        "marketId",
        "marketName",
        "gameId",
      ],
      include: [
        {
          model: Runner,
          attributes: [
            "runnerId",
            "runnerName",
            "id",
            "bal",
            "back",
            "lay",
            "isWin",
          ],
          where: {
            isWin: true,
            runnerName: {
              [Sequelize.Op.like]: `%${searchQuery}%`
            }
          },
        },
      ],
      limit,
      offset,
    });

    if (markets.length === 0) {
      return res
        .status(statusCode.success)
        .json(apiResponseSuccess([], true, statusCode.success, "No markets found"));
    }

    // Extract gameIds from markets
    const gameIds = [...new Set(markets.map(market => market.gameId))];

    // Fetch games that have markets with winning runners
    const { count: totalGames, rows: games } = await Game.findAndCountAll({
      where: {
        gameId: gameIds,
        gameName: {
          [Sequelize.Op.like]: `%${searchQuery}%`
        }
      },
      attributes: ["gameId", "gameName", "description", "isBlink"],
      include: [
        {
          model: Market,
          attributes: [
            "marketId",
            "marketName",
          ],
          include: [
            {
              model: Runner,
              attributes: [
                "runnerId",
                "runnerName",
                "id",
                "bal",
                "back",
                "lay",
                "isWin",
              ],
              where: {
                isWin: true,
                runnerName: {
                  [Sequelize.Op.like]: `%${searchQuery}%`
                }
              },
            },
          ],
        },
      ],
      limit,
      offset,
    });

    // Calculate pagination details
    const totalItems = totalGames;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Format the game data
    const formattedGameData = games.flatMap((game) =>
      game.Markets.map((market) => ({
        game: {
          gameId: game.gameId,
          gameName: game.gameName,
        },
        market: {
          marketId: market.marketId,
          marketName: market.marketName,
        },
        runners: market.Runners.map((runner) => ({
          runnerId: runner.runnerId,
          runnerName: runner.runnerName,
          id: runner.id,
          bal: runner.bal,
          lay: runner.lay,
          back: runner.back,
          isWin: runner.isWin,
        })),
      }))
    );

    res
      .status(statusCode.success)
      .json(
        apiResponseSuccess(
          formattedGameData,
          true,
          statusCode.success,
          "Success", 
          {
          page: parseInt(page, 10),
          pageSize: parseInt(pageSize, 10),
          totalItems,
          totalPages,
        }
        )
      );
  } catch (error) {
    console.error("Error retrieving game data:", error);
    res
      .status(statusCode.internalServerError)
      .json(
        apiResponseErr(
          null,
          false,
          statusCode.internalServerError,
          error.message
        )
      );
  }
};





