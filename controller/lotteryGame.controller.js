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
    const params = {
      sem,
      page,
      limit,
    };
    const response = await axios.get(
      "http://localhost:8080/api/get-external-lotteries",
      {
        params,
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
          data,
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
    const response = await axios.get(
      `http://localhost:8080/api/getParticularLotteries/${lotteryId}`,
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
    const { data } = response.data;
    if (users.balance <= data) {
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
    users.balance = users.balance - data;

    let currentMarketListExposure = users.marketListExposure || [];

    const newExposure = { [lotteryId]: data };

    currentMarketListExposure.push(newExposure);

    users.setDataValue("marketListExposure", currentMarketListExposure);

    await users.save({ fields: ["balance", "marketListExposure"] });

    const dataToSend = {
      userId: users.userId,
      lotteryId,
      userName: users.userName,
    };
    const purchaseRes = await axios.post(
      `http://localhost:8080/api/create-purchase-lottery`,
      dataToSend,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!purchaseRes.data.success) {
      return res
        .status(statusCode.badRequest)
        .send(
          apiResponseErr(null, false, statusCode.badRequest, "Failed to create")
        );
    }

    const updateBalance = {
      userId: users.userId,
      amount: users.balance,
    };
    const updateWhiteLabelBalance = await axios.post(
      `http://localhost:8000/api/admin/extrnal/balance-update`,
      updateBalance
    );

    if (!updateWhiteLabelBalance.data.success) {
      return res
        .status(statusCode.badRequest)
        .send(
          apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            "Failed to update balance"
          )
        );
    }

    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          null,
          true,
          statusCode.success,
          "Lottery purchase successfully"
        )
      );
  } catch (error) {
    console.error(
      "Error from API:",
      error.response ? error.response.data : error.message
    );

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

export const lotteryAmount = async (req, res) => {
  try {
    const users = req.user;
    const { lotteryId } = req.body;
    const token = jwt.sign({ roles: users.roles }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    const response = await axios.get(
      `http://localhost:8080/api/getParticularLotteries/${lotteryId}`,
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
    const  {data } = response.data;
  
    
    
    return res
    .status(statusCode.success)
    .send(
      apiResponseSuccess(
       data ,
        true,
        statusCode.success,
        `Lottery amount is : ${data} Rs`
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


// Dummy data api function

const lotteryData = Array.from({ length: 100 }, (_, index) => ({
  lotteryId: `2723afdc-f93a-495f-87db-c8c24ffc38c${index}`,
  name: `Lottery ${index + 1}`,
  date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
  createdAt: new Date().toISOString(),
  firstPrize: Math.floor(Math.random() * 1000000) + 100000,
  isPurchased: Math.random() > 0.5,
  price: Math.floor(Math.random() * 20) + 1,
  sem: [5, 10, 25, 50, 100, 200][Math.floor(Math.random() * 6)],
}));

export const dummyData = async (req, res) => {
  const page = parseInt(req.query.page) || 1; 
  const limit = parseInt(req.query.limit) || 10; 
  const offset = (page - 1) * limit; 

  try {
    const paginatedLotteries = lotteryData.slice(offset, offset + limit);
    const totalItems = lotteryData.length;

    const paginationInfo = {
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
      itemsPerPage: limit,
    };

    res.json({
      lotteries: paginatedLotteries,
      pagination: paginationInfo,
    });
  } catch (error) {
    console.error('Error fetching lotteries:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};