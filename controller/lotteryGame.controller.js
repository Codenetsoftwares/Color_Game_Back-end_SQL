import axios from "axios";
import jwt from "jsonwebtoken";

import { statusCode } from "../helper/statusCodes.js";
import {
  apiResponseErr,
  apiResponseSuccess,
} from "../middleware/serverError.js";
import userSchema from "../models/user.model.js";

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

export const searchTicket = async (req, res) => {
  try {
    const { group, series, number, sem } = req.body
    const baseURL = process.env.LOTTERY_URL
    console.log("baseURl...............", baseURL)

    const response = await axios.post(`${baseURL}/api/search-ticket`, { group, series, number, sem });

    console.log('Full API Response:', JSON.stringify(response.data, null, 2));

    if (!response.data.success) {
      return res.status(statusCode.badRequest).send(apiResponseErr(null, false, statusCode.badRequest, "Failed to search ticket"));
    }

    return res.status(statusCode.success).send(apiResponseSuccess(response.data.data, true, statusCode.success, "Success"));

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(statusCode.internalServerError).send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }

}

export const purchaseLottery = async (req, res) => {
  try {
    const { generateId, lotteryPrice } = req.body;
    const { userId, userName, roles, balance, marketListExposure } = req.user;
    const { marketId } = req.params;
    const baseURL = process.env.LOTTERY_URL;

    const token = jwt.sign({ roles }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    if (balance < lotteryPrice) {
      return res.status(statusCode.badRequest).send(apiResponseErr(null, false, statusCode.badRequest, "Insufficient balance"));
    }

    const user = await userSchema.findOne({ where: { userId } });
    user.balance -= lotteryPrice;
    const newExposure = { [generateId]: lotteryPrice };
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
      axios.post(`http://localhost:8000/api/admin/extrnal/balance-update`, {
        userId,
        amount: balance - lotteryPrice,
      }),
    ]);

    if (!lotteryResponse.data.success) {
      return res.status(statusCode.badRequest).send(apiResponseErr(null, false, statusCode.badRequest, "Failed to purchase lottery"));
    }

    return res.status(statusCode.success).send(apiResponseSuccess(null, true, statusCode.create, "Lottery purchased successfully"));
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(statusCode.internalServerError).send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
};

export const purchaseHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page, limit, sem } = req.query;
    const params = {
      page,
      limit,
      sem,
    };

    const baseURL = process.env.LOTTERY_URL;
    const response = await axios.post(
      `${baseURL}/api/purchase-history`,
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

export const getDrawDateByDate = async (req, res) => {
  try {
    const token = jwt.sign({ roles: req.user.roles }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
    console.log("Testinggg.......", token)
    const baseURL = process.env.LOTTERY_URL;
    const response = await axios.get(`${baseURL}/api/draw-dates`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data.success) {
      return res.status(statusCode.badRequest).send(apiResponseErr(null, false, statusCode.badRequest, "Failed to get Draw Date"));
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

