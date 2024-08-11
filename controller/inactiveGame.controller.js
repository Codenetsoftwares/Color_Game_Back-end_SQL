import { statusCode } from "../helper/statusCodes.js";
import {
  apiResponseErr,
  apiResponseSuccess,
} from "../middleware/serverError.js";
import Game from "../models/game.model.js";
import InactiveGame from "../models/inactiveGame.model.js";
import Market from "../models/market.model.js";
import Runner from "../models/runner.model.js";

export const getInactiveGames = async (req, res) => {
  try {
    const inactiveGames = await InactiveGame.findAll();

    if (inactiveGames.length === 0) {
      return res
        .status(statusCode.success)
        .json(
          apiResponseSuccess(
            [],
            true,
            statusCode.success,
            "No inactive games found"
          )
        );
    }

    const formattedData = inactiveGames.map((inactiveGame) => {
      const { game, market } = inactiveGame;
      const runners = market.Runners || [];

      return {
        game: {
          id: game.id,
          gameId: game.gameId,
          isBlink: game.isBlink,
          gameName: game.gameName,
          description: game.description,
        },
        market: {
          marketId: market.marketId,
          marketName: market.marketName,
          isActive: market.isActive,
          timeSpan: market.timeSpan,
          isDisplay: market.isDisplay,
          participants: market.participants,
          announcementResult: market.announcementResult,
        },
        runners: runners.map((runner) => ({
          runnerId: runner.runnerId,
          runnerName: runner.runnerName,
          id: runner.id,
          bal: runner.bal,
          lay: runner.lay,
          back: runner.back,
          isWin: runner.isWin,
        })),
      };
    });

    return res
      .status(statusCode.success)
      .json(
        apiResponseSuccess(
          formattedData,
          true,
          statusCode.success,
          "Inactive games retrieved successfully"
        )
      );
  } catch (error) {
    return res
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

export const moveToActiveGame = async (req, res) => {
  const { gameId } = req.body;

  try {
    const inactiveGame = await InactiveGame.findOne({ where: { 'game.gameId': gameId } });

    if (!inactiveGame) {
      return res
        .status(statusCode.notFound)
        .json(apiResponseErr(null, false, statusCode.notFound, 'Inactive game not found'));
    }

    await Market.update(
      { hideMarket: false },
      { where: { marketId: inactiveGame.market.marketId } }
    );

    await Runner.update(
      { hideRunner: false },
      { where: { marketId: inactiveGame.market.marketId } }
    );

    await InactiveGame.destroy({ where: { gameId: inactiveGame.gameId } });

    return res
      .status(statusCode.success)
      .json(apiResponseSuccess(null, true, statusCode.success, 'Game moved to active status successfully'));
  } catch (error) {
    return res
      .status(statusCode.internalServerError)
      .json(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
};
