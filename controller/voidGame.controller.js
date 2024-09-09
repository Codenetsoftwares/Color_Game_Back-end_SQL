import { statusCode } from "../helper/statusCodes.js";
import {
  apiResponseErr,
  apiResponseSuccess,
} from "../middleware/serverError.js";
import Market from "../models/market.model.js";
import MarketBalance from "../models/marketBalance.js";
import userSchema from "../models/user.model.js";
import axios from "axios";

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
