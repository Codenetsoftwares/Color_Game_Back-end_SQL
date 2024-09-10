import { statusCode } from "../helper/statusCodes.js";
import {
  apiResponseErr,
  apiResponseSuccess,
} from "../middleware/serverError.js";
import Market from "../models/market.model.js";
import MarketBalance from "../models/marketBalance.js";
import userSchema from "../models/user.model.js";
import axios from "axios";
import CurrentOrder from "../models/currentOrder.model.js";
import Game from "../models/game.model.js";
import Runner from "../models/runner.model.js";

export const voidMarket = async (req, res) => {
  try {
    const { marketId, isVoid } = req.body;

    const market = await Market.findOne({ where: { marketId } });
    if (!market) {
      return res
        .status(statusCode.badRequest)
        .json(apiResponseErr(null, false, statusCode.badRequest, "Market not found"));
    }

    if (!isVoid) {
      return res
        .status(statusCode.badRequest)
        .json(apiResponseErr(null, false, statusCode.badRequest, "Invalid request"));
    }

    market.isVoid = true;
    await market.save();

    const users = await MarketBalance.findAll({ where: { marketId } });

    for (const user of users) {
      const userDetails = await userSchema.findOne({ where: { userId: user.userId } });

      if (userDetails) {
        const marketExposureEntry = userDetails.marketListExposure.find(
          (item) => Object.keys(item)[0] === marketId
        );

        if (marketExposureEntry) {
          const marketExposureValue = Number(marketExposureEntry[marketId]);

          userDetails.balance += marketExposureValue;
          userDetails.marketListExposure = userDetails.marketListExposure.filter(
            (item) => Object.keys(item)[0] !== marketId
          );

          await userDetails.save();

          const dataToSend = {
            amount: userDetails.balance,
            userId: userDetails.userId,
          };
          const response  = await axios.post(
            "https://wl.server.dummydoma.in/api/admin/extrnal/balance-update",
            dataToSend
          );

          if (!response.data.success) {
            return res
              .status(statusCode.badRequest)
              .json(apiResponseErr(null, false, statusCode.badRequest, "Failed to update balance"));
          }

          await MarketBalance.destroy({
            where: { marketId, userId: user.userId },
          });
          await CurrentOrder.destroy({
            where: { marketId, userId: user.userId },
          });
        }
      }
    }

    return res
      .status(statusCode.success)
      .json(apiResponseSuccess(null, true, statusCode.success, "Market voided successfully"));
  } catch (error) {
    console.error("Error voiding market:", error);
    return res
      .status(statusCode.internalServerError)
      .json(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
};

export const getAllVoidMarkets = async (req, res) => {
  try {
    const gameData = await Game.findAll({
      attributes: ["gameId", "gameName", "description", "isBlink"],
      include: [
        {
          model: Market,
          attributes: [
            "marketId",
            "marketName",
            "participants",
            "startTime",
            "endTime",
            "announcementResult",
            "isActive",
            "hideMarketUser",
            "isVoid",
          ],
          include: [
            {
              model: Runner,
              attributes: [
                "runnerId",
                "runnerName",
                "isWin",
                "bal",
                "back",
                "lay",
                "hideRunnerUser",
              ],
            },
          ],
          where: { isVoid: true }, 
        },
      ],
    });

    const formattedGameData = gameData
      .filter(game => game.Markets && game.Markets.length > 0) // Filter out games with no void markets
      .map((game) => ({
        gameId: game.gameId,
        gameName: game.gameName,
        description: game.description,
        isBlink: game.isBlink,
        markets: game.Markets.map((market) => ({
          marketId: market.marketId,
          marketName: market.marketName,
          participants: market.participants,
          startTime: market.startTime,
          endTime: market.endTime,
          announcementResult: market.announcementResult,
          isActive: market.isActive,
          isVoid: market.isVoid,
          runners: market.Runners.map((runner) => ({
            runnerId: runner.runnerId,
            runnerName: runner.runnerName,
            isWin: runner.isWin,
            bal: runner.bal,
            rate: [
              {
                back: runner.back,
                lay: runner.lay,
              },
            ],
          })),
        })),
      }));

    res
      .status(statusCode.success)
      .json(
        apiResponseSuccess(
          formattedGameData,
          true,
          statusCode.success,
          "Success"
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
