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
import { Op } from "sequelize";
import BetHistory from "../models/betHistory.model.js";

export const voidMarket = async (req, res) => {
  try {
    const { marketId } = req.body;

    const market = await Market.findOne({ where: { marketId } });
    if (!market) {
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, false, statusCode.badRequest, "Market not found"));
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

          const orders = await CurrentOrder.findAll({ where: { marketId } });

          for (const order of orders) {
            await BetHistory.create({
              userId: order.userId,
              userName: order.userName,
              gameId: order.gameId,
              gameName: order.gameName,
              marketId: order.marketId,
              marketName: order.marketName,
              runnerId: order.runnerId,
              runnerName: order.runnerName,
              rate: order.rate,
              value: order.value,
              type: order.type,
              date: new Date(),
              matchDate: order.date,
              bidAmount: order.bidAmount,
              isWin: order.isWin,
              profitLoss: order.profitLoss,
              placeDate: order.createdAt,
              isVoid: true
            });
          }

          const dataToSend = {
            amount: userDetails.balance,
            userId: userDetails.userId,
            exposure: marketExposureValue
          };
          const baseURL = process.env.WHITE_LABEL_URL

          const response = await axios.post(
            `${baseURL}/api/admin/extrnal/balance-update`,
            dataToSend
          );

          if (!response.data.success) {
            return res
              .status(statusCode.badRequest)
              .send(apiResponseErr(null, false, statusCode.badRequest, "Failed to update balance"));
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
      .send(apiResponseSuccess(null, true, statusCode.success, "Market voided successfully"));
  } catch (error) {
    console.error("Error voiding market:", error);
    return res
      .status(statusCode.internalServerError)
      .send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
};

export const getAllVoidMarkets = async (req, res) => {
  try {
    let { page = 1, pageSize = 10, gameName } = req.query;
    page = parseInt(page);
    pageSize = parseInt(pageSize);

    const offset = (page - 1) * pageSize;

    const gameFilter = gameName ? { gameName: { [Op.like]: `%${gameName}%` } } : {};

    const totalItems = await Market.count({
      where: { isVoid: true },
      include: [
        {
          model: Game,
          where: gameFilter
        }
      ]
    });

    const markets = await Market.findAll({
      where: { isVoid: true },
      include: [
        {
          model: Game,
          attributes: ['gameId', 'gameName'],
          where: gameFilter
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
      .send(apiResponseSuccess(
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
      .send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
};



