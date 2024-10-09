import axios from "axios";
import { statusCode } from "../helper/statusCodes.js";
import {
  apiResponseErr,
  apiResponseSuccess,
} from "../middleware/serverError.js";
import userSchema from "../models/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const getLotteryGame = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, sem } = req.query;
    const limit = parseInt(pageSize);
    const params = { sem, page, limit };

    const response = await axios.get(
      "http://localhost:8080/api/get-external-lotteries",
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
            "Failed to fetch data"
          )
        );
    }

    const { data, pagination } = response.data;

    const parsedData = data.map((lottery) => {
      let ticketNumber = [];

      if (Array.isArray(lottery.ticketNumber)) {
        ticketNumber = lottery.ticketNumber;
      } else {
        try {
          ticketNumber = JSON.parse(lottery.ticketNumber);
        } catch (error) {
          console.error("Error parsing ticketNumber:", error);
        }
      }

      return {
        ...lottery,
        ticketNumber,
      };
    });

    const paginationData = {
      page: pagination?.page || page,
      totalPages: pagination?.totalPages || 1,
      totalItems: pagination?.totalItems || data.length,
      limit: pagination?.limit || limit,
    };

    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          parsedData,
          true,
          statusCode.success,
          "Success",
          paginationData
        )
      );
  } catch (error) {
    res
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

//Not Use
export const getUser = async (req, res) => {
  try {
    const users = await userSchema.findAll({
      attributes: ["userName", "userId", "balance"],
    });
    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          users,
          true,
          statusCode.success,
          "User retrieve successfully"
        )
      );
  } catch (error) {
    res
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

export const purchaseLotteryTicket = async (req, res) => {
  try {
    const users = req.user;
    const { lotteryId } = req.body;

    const token = jwt.sign({ roles: users.roles }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    const [response, balanceUpdateResponse] = await Promise.all([
      axios.get(
        `http://localhost:8080/api/getParticularLotteries/${lotteryId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ),
      axios.post(`http://localhost:8000/api/admin/extrnal/balance-update`, {
        userId: users.userId,
        amount: users.balance,
      }),
    ]);

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

    const lotteryPrice = response.data.data;
    if (users.balance < lotteryPrice) {
      return res
        .status(statusCode.badRequest)
        .send(
          apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            "Insufficient balance"
          )
        );
    }

    users.balance -= lotteryPrice;
    const newExposure = { [lotteryId]: lotteryPrice };
    users.marketListExposure = [
      ...(users.marketListExposure || []),
      newExposure,
    ];
    await users.save({ fields: ["balance", "marketListExposure"] });

    const purchaseRes = await axios.post(
      `http://localhost:8080/api/create-purchase-lottery`,
      {
        userId: users.userId,
        lotteryId,
        userName: users.userName,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!purchaseRes.data.success) {
      return res
        .status(statusCode.badRequest)
        .send(
          apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            "Failed to create purchase"
          )
        );
    }

    purchaseRes.data.data["lotteryPrice"] = lotteryPrice;
    delete purchaseRes.data.data.ticketNumber;
    delete purchaseRes.data.data.price;
    delete purchaseRes.data.data.isPurchased;
    delete purchaseRes.data.data.createdAt;
    delete purchaseRes.data.data.updatedAt;

    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          purchaseRes.data.data,
          true,
          statusCode.success,
          `Lottery purchased successfully`
        )
      );
  } catch (error) {
    console.error(
      "Error from API:",
      error.response ? error.response.data : error.message
    );
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

export const lotteryAmount = async (req, res) => {
  try {
    const users = req.user;
    const { lotteryId } = req.params; // Now getting lotteryId from params
    const token = jwt.sign({ roles: users.roles }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    const response = await axios.get(
      `http://localhost:8080/api/getParticularLotteries/${lotteryId}`, // lotteryId is included in the URL
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.data.success) {
      return res
        .status(statusCode.badRequest)
        .send(
          apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            "Failed to fetch data from external API"
          )
        );
    }
    const { data } = response.data;

    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          data,
          true,
          statusCode.success,
          `Lottery amount of ₹${data} `
        )
      );
  } catch (error) {
    res
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

export const getUserPurchases = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const token = jwt.sign(
      { roles: req.user.roles },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    const response = await axios.get(
      `http://localhost:8080/api/user-purchases/${userId}?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

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

    const { data, pagination } = response.data;

    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          data,
          true,
          statusCode.success,
          "Success",
          pagination
        )
      );
  } catch (error) {
    res
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

export const getResult = async (req, res) => {
  try {
    const users = req.user;
    const { resultId } = req.params; // Now getting lotteryId from params
    const token = jwt.sign({ roles: users.roles }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    const response = await axios.get(
      `http://localhost:8080/api/lotteries/get-result/${resultId}`, // lotteryId is included in the URL
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.data.success) {
      return res
        .status(statusCode.badRequest)
        .send(
          apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            "Failed to fetch data from external API"
          )
        );
    }
    const { data } = response.data;

    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          data,
          true,
          statusCode.success,
          `Result fetch Successfully `
        )
      );
  } catch (error) {
    res
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

export const searchTicketNumber = async (req, res) => {
  try {
    const users = req.user;
    const { ticketNumber } = req.params;
    const token = jwt.sign({ roles: users.roles }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    const response = await axios.get(
      `http://localhost:8080/api/search-lottery/${ticketNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.data.success) {
      return res
        .status(statusCode.badRequest)
        .send(
          apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            "Failed to fetch data from external API"
          )
        );
    }
    const { data } = response.data;

    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          data,
          true,
          statusCode.success,
          `Result fetch Successfully `
        )
      );
  } catch (error) {
    res
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
