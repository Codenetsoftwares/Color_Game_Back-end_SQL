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
    let { page = 1, pageSize = 10 } = req.query;
    page = parseInt(page);
    pageSize = parseInt(pageSize);

    const offset = (page - 1) * pageSize;

    const totalItems = await Market.count({
      where: { isVoid: true }
    });

    const markets = await Market.findAll({
      where: { isVoid: true },
      include: [
        {
          model: Game,
          attributes: ['gameId', 'gameName']
        },
        {
          model: Runner,
          attributes: ['runnerId', 'runnerName', 'back', 'lay']
        }
      ],
      attributes: ['marketId', 'marketName', 'gameId'],
      limit: pageSize,
      offset: offset
    });

    const formattedMarkets = markets.map(market => ({
      gameId: market.Game.gameId,
      gameName: market.Game.gameName,
      marketId: market.marketId,
      marketName: market.marketName,
      Runners: market.Runners.map(runner => ({
        runnerId: runner.runnerId,
        runnerName: runner.runnerName,
        back: runner.back,
        lay: runner.lay
      }))
    }));

    const totalPages = Math.ceil(totalItems / pageSize);

    return res
      .status(statusCode.success)
      .json(apiResponseSuccess(
        formattedMarkets,
        true,
        statusCode.success,
        'Voided markets retrieved successfully',
        {
          page,
          pageSize,
          totalItems,
          totalPages
        }));
  } catch (error) {
    console.error('Error retrieving voided markets:', error);
    return res
      .status(statusCode.internalServerError)
      .json(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
};



