import axios from "axios";
import jwt from 'jsonwebtoken';
import { statusCode } from "../helper/statusCodes.js";
import {
  apiResponseErr,
  apiResponseSuccess,
} from "../middleware/serverError.js";
import userSchema from "../models/user.model.js";
import LotteryProfit_Loss from "../models/lotteryProfit_loss.model.js";

export const searchTicket = async (req, res) => {
  try {
    const { group, series, number, sem, marketId } = req.body;

    const baseURL = process.env.LOTTERY_URL;

    const token = jwt.sign(
      { roles: req.user.roles }, 
      process.env.JWT_SECRET_KEY, 
      { expiresIn: '1h' }
    );

    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const payload = { group, series, number, sem, marketId };

    const response = await axios.post(`${baseURL}/api/search-ticket`, payload, { headers });

    if (!response.data.success) {
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, false, statusCode.badRequest, "Failed to search ticket"));
    }

    return res
      .status(statusCode.success)
      .send(apiResponseSuccess(response.data.data, true, statusCode.success, "Success"));

  } catch (error) {
    return res.status(statusCode.internalServerError).send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
};

export const purchaseLottery = async (req, res) => {
  try {
    const { generateId, lotteryPrice } = req.body;
    const { userId, userName, roles, balance, marketListExposure } = req.user;
    const { marketId } = req.params;
    const baseURL = process.env.LOTTERY_URL;
    const whiteLabelUrl = process.env.WHITE_LABEL_URL;

    const token = jwt.sign({ roles }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    if (balance < lotteryPrice) {
      return res.status(statusCode.badRequest).send(apiResponseErr(null, false, statusCode.badRequest, "Insufficient balance"));
    }

    const user = await userSchema.findOne({ where: { userId } });
    user.balance -= lotteryPrice;
    const newExposure = { [marketId]: lotteryPrice };
    user.marketListExposure = [...(marketListExposure || []), newExposure];
    await user.save({ fields: ["balance", "marketListExposure"] });

    const [lotteryResponse] = await Promise.all([
      axios.post(
        `${baseURL}/api/purchase-lottery/${marketId}`,
        { generateId, userId, userName, lotteryPrice },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ),
      axios.post(`${whiteLabelUrl}/api/admin/extrnal/balance-update`, {
        userId,
        amount: balance - lotteryPrice,
        exposure: lotteryPrice
      }),
    ]);

    if (!lotteryResponse.data.success) {
      return res.status(statusCode.badRequest).send(apiResponseErr(null, false, statusCode.badRequest, "Failed to purchase lottery"));
    }

    return res.status(statusCode.success).send(apiResponseSuccess(null, true, statusCode.create, "Lottery purchased successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res.status(statusCode.internalServerError).send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
};


export const purchaseHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page, limit, sem } = req.query;
    const { marketId } = req.params;

    const params = {
      page,
      limit,
      sem
    };

    const baseURL = process.env.LOTTERY_URL;
    const response = await axios.post(
      `${baseURL}/api/purchase-history/${marketId}`,
      { userId },
      { params }
    );

    if (!response.data.success) {
      return res
        .status(statusCode.badRequest)
        .send(
          apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            "Failed to get purchase history"
          )
        );
    }

    const { data, pagination } = response.data;
    const paginationData = {
      page: pagination?.page || page,
      limit: pagination?.limit || limit,
      totalPages: pagination?.totalPages || 1,
      totalItems: pagination?.totalItems || data.length,
    };
    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          data,
          true,
          statusCode.success,
          "Success",
          paginationData
        )
      );
  } catch (error) {
    console.error('Error:', error);

    return res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          null,
          false,
          statusCode.internalServerError,
          error.message
        )
      );
  }

}

export const getTicketRange = async (req, res) => {
  try {
    const baseURL = process.env.LOTTERY_URL;
    const response = await axios.get(`${baseURL}/api/get-range`);

    if (!response.data.success) {
      return res.status(statusCode.badRequest).send(apiResponseErr(null, false, statusCode.badRequest, "Failed to get purchase history"));
    }

    return res.status(statusCode.success).send(apiResponseSuccess(response.data.data, true, statusCode.success, "Success"));

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(statusCode.internalServerError).send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }

}




export const getResult = async (req, res) => {
  try {
    const token = jwt.sign({ roles: req.user.roles }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
    const baseURL = process.env.LOTTERY_URL;

    const response = await axios.get(`${baseURL}/api/prize-results`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data.success) {
      return res.status(statusCode.badRequest).send(apiResponseErr(null, false, statusCode.badRequest, "Failed to get result"));
    }

    return res.status(statusCode.success).send(apiResponseSuccess(response.data.data, true, statusCode.success, "Success"));

  } catch (error) {

    return res.status(statusCode.internalServerError).send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
}

export const getMarkets = async (req, res) => {
  try {
    const token = jwt.sign(
      { roles: req.user.roles },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );
    const baseURL = process.env.LOTTERY_URL;
    const response = await axios.get(`${baseURL}/api/getAll-markets`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data.success) {
      return res
        .status(statusCode.badRequest)
        .send(
          apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            "Failed to get Draw Date"
          )
        );
    }

    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          response.data.data,
          true,
          statusCode.success,
          "Success"
        )
      );
  } catch (error) {
    return res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          null,
          false,
          statusCode.internalServerError,
          error.message
        )
      );
  }
};

export const updateBalance = async (req, res) => {
  try {
    const { userId, prizeAmount, marketId } = req.body;
    console.log("Received userId:", userId, "Received prizeAmount:", prizeAmount, "Received marketId:", marketId);

    const user = await userSchema.findOne({ where: { userId } });
    if (!user) {
      return res.status(statusCode.badRequest).send(apiResponseErr(null, false, statusCode.badRequest, 'User not found.'));
    }

    let totalBalanceUpdate = prizeAmount;

    if (user.marketListExposure) {
      const marketExposure = user.marketListExposure.find(exposure => exposure[marketId]);

      if (marketExposure) {
        const exposureValue = marketExposure[marketId];
        totalBalanceUpdate += exposureValue;
        console.log(`Market exposure found for ${marketId}:`, exposureValue);

        user.marketListExposure = user.marketListExposure.filter(exposure => !exposure[marketId]);
      }
    }

    user.balance += totalBalanceUpdate;

    const dataToSend = {
      amount: user.balance,
      userId,
      exposure: exposureValue
    };
    const baseURL = process.env.WHITE_LABEL_URL;
    const { data: response } = await axios.post(
      `${baseURL}/api/admin/extrnal/balance-update`,
      dataToSend,
    );

    let message = response.success ? "Sync data successful" : "Sync not successful";

    await user.save();

    return res.status(statusCode.success).send(apiResponseSuccess(null, true, statusCode.success, "Balance Update" + " " + message));
  } catch (error) {
    console.log("Error:", error);
    return res.status(statusCode.internalServerError).send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
};

export const removeExposer = async (req, res) => {
  try {
    const { userId, marketId, marketName } = req.body;

    const user = await userSchema.findOne({ where: { userId } });
    if (!user) {
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, false, statusCode.badRequest, 'User not found.'));
    }

    if (user.marketListExposure) {
      const exposures = Array.isArray(user.marketListExposure)
        ? user.marketListExposure
        : JSON.parse(user.marketListExposure);

      const marketExposure = exposures.find(exposure => exposure[marketId] !== undefined);

      if (marketExposure) {
        let marketListExposureValue = marketExposure[marketId];
        user.marketListExposure = exposures.filter(exposure => !exposure[marketId]);

        await LotteryProfit_Loss.create({
          userId,
          userName: user.userName,
          marketId,
          marketName,
          profitLoss: -marketListExposureValue,
        });

      }
    }

    await user.save();

    return res
      .status(statusCode.success)
      .send(apiResponseSuccess(null, true, statusCode.success, 'Balance updated successfully.'));
  } catch (error) {
    console.log("Error:", error);
    return res
      .status(statusCode.internalServerError)
      .send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
};


export const getLotteryResults = async (req, res) => {
  try {
    const { marketId } = req.params;
    const baseURL = process.env.LOTTERY_URL;

    const response = await axios.get(
      `${baseURL}/api/lottery-results/${marketId}`,
    );

    if (!response.data.success) {
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, false, statusCode.badRequest, 'Failed to fetch data'));
    }

    const { data } = response.data;

    return res.status(statusCode.success).send(apiResponseSuccess(data, true, statusCode.success, 'Lottery results fetched successfully.'));
  } catch (error) {
    console.log("Error fetching results:", error);
    return res.status(statusCode.internalServerError).send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
};

export const createLotteryP_L = async (req, res) => {
  try {
    const {
      userId,
      userName,
      marketId,
      marketName,
      ticketNumber,
      price,
      sem,
      profitLoss,
    } = req.body;

    const newEntry = await LotteryProfit_Loss.create({
      userId,
      userName,
      marketId,
      marketName,
      ticketNumber,
      price,
      sem,
      profitLoss,
    });

    return res.status(statusCode.create).send(apiResponseSuccess(newEntry, true, statusCode.create, 'Success'));
  } catch (error) {
    return res.status(statusCode.internalServerError).send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
}

export const getLotteryP_L = async (req, res) => {
  try {
    const user = req.user
    const lotteryProfitLossRecords = await LotteryProfit_Loss.findAll({
      where: { userId: user.userId },
      attributes: ['gameName', 'marketName', 'marketId', 'profitLoss']
    });

    return res.status(statusCode.success).send(apiResponseSuccess(lotteryProfitLossRecords, true, statusCode.success, 'Success'));
  } catch (error) {
    return res.status(statusCode.internalServerError).send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
}

export const getLotteryBetHistory = async (req, res) => {
  try {
    const userId = req.user.userId
    const baseURL = process.env.LOTTERY_URL;
    const response = await axios.post(`${baseURL}/api/lottery-external-bet-history`, { userId });

    if (!response.data.success) {
      return res
        .status(statusCode.badRequest)
        .send(
          apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            "Failed to fetch data"
          )
        );
    }

    return res.status(statusCode.success).send(apiResponseSuccess(response.data.data, true, statusCode.success, 'Success'));
  } catch (error) {
    console.error('Error:', error);

    return res.status(statusCode.internalServerError).send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
}


export const dateWiseMarkets = async (req, res) => {
  try {
    const token = jwt.sign({ roles: req.user.roles }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
    const { date } = req.query;
    const baseURL = process.env.LOTTERY_URL;

    const response = await axios.get(`${baseURL}/api/user/dateWise-markets`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        date,
      },
    });

    if (!response.data.success) {
      return res.status(statusCode.badRequest).send(apiResponseErr(null, false, statusCode.badRequest, "Failed to get market"));
    }

    return res.status(statusCode.success).send(apiResponseSuccess(response.data.data, true, statusCode.success, "Success"));

  } catch (error) {

    return res.status(statusCode.internalServerError).send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
}

export const getAllMarket = async (req, res) => {
  try {
    const token = jwt.sign(
      { roles: req.user.roles, userId: req.user.userId }, 
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    const baseURL = process.env.LOTTERY_URL;
    const response = await axios.get(`${baseURL}/api/user/get-markets`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data.success) {
      return res
        .status(statusCode.badRequest)
        .send(
          apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            "Failed to get markets"
          )
        );
    }

    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          response.data.data,
          true,
          statusCode.success,
          "Success"
        )
      );
  } catch (error) {
    return res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          null,
          false,
          statusCode.internalServerError,
          error.message
        )
      );
  }
};
