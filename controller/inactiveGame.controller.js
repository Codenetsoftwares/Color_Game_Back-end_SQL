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
  const { marketId } = req.body;

  try {
    const inactiveGame = await InactiveGame.findOne({
      where: {
        'market.marketId': marketId 
      }
    });

    if (!inactiveGame) {
      return res
        .status(statusCode.badRequest)
        .json(apiResponseErr(null, false, statusCode.badRequest, 'Inactive game not found'));
    }

    const [marketUpdateCount] = await Market.update(
      { hideMarket: false },
      { where: { marketId } } 
    );

    if (marketUpdateCount === 0) {
      console.error('Market not found or not updated:', marketId);
    }

    const [runnerUpdateCount] = await Runner.update(
      { hideRunner: false },
      { where: { marketId } }
    );

    if (runnerUpdateCount === 0) {
      console.error('Runners not found or not updated for Market:', marketId);
    }

    const deleteCount = await InactiveGame.destroy({
      where: {
        id: inactiveGame.id 
      }
    });

    if (deleteCount === 0) {
      console.error('InactiveGame not found or not deleted for Market:', marketId);
    } else {
      console.log('InactiveGame deleted successfully');
    }

    return res
      .status(statusCode.success)
      .json(apiResponseSuccess(null, true, statusCode.success, 'Game moved to active status successfully'));
  } catch (error) {
    console.error('Error moving game to active status:', error);
    return res
      .status(statusCode.internalServerError)
      .json(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
};

