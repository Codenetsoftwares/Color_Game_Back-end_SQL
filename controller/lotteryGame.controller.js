import axios from "axios";
import { statusCode } from "../helper/statusCodes.js";
import {
  apiResponseErr,
  apiResponseSuccess,
} from "../middleware/serverError.js";
import { API_URL } from '../helper/manageUrl.js';

export const searchTicket = async (req, res) => {
  try {
    const { group, series, number, sem } = req.body
    const baseURL = API_URL().lotteryUrl
    console.log("baseURl...............",baseURL)

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
    const { generateId, drawDate } = req.body
    const userId = req.user.userId
    const userName = req.user.userName
    const baseURL = API_URL().lotteryUrl;
    const response = await axios.post(`${baseURL}/api/purchase-lottery`, { generateId, drawDate, userId, userName });

    if (!response.data.success) {
      return res.status(statusCode.badRequest).send(apiResponseErr(null, false, statusCode.badRequest, "Failed to purchase lottery"));
    }

    return res.status(statusCode.success).send(apiResponseSuccess(null, true, statusCode.create, "Lottery purchase successfully"));

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(statusCode.internalServerError).send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }

}

export const purchaseHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page, limit ,sem} = req.query; 
    const params = {
      page,
      limit,
      sem
    };
    const baseURL = API_URL().lotteryUrl;
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
    const baseURL = API_URL().lotteryUrl;
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