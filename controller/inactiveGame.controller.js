import { statusCode } from "../helper/statusCodes.js";
import {
  apiResponseErr,
  apiResponseSuccess,
} from "../middleware/serverError.js";
import InactiveGame from "../models/inactiveGame.model.js";

export const getInactiveGames = async (req, res) => {
  try {
    const inactiveGames = await InactiveGame.findAll({
      where: { hideGameDetails: true },
    });

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

    // Format the response data
    const formattedData = inactiveGames.map((inactiveGame) => {
      const { game, market } = inactiveGame;
      const runners = market.Runners || []; // Adjusted to use 'Runners' as per your data

      // Log the market object to debug its structure
      console.log("Market object:", market);

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
    console.error("Error retrieving inactive games:", error);
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
