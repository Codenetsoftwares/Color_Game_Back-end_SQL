import axios from "axios";
import { statusCode } from "../helper/statusCodes.js";
import { apiResponseErr, apiResponseSuccess } from "../middleware/serverError.js";
import userSchema from "../models/user.model.js";

export const getLotteryGame = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, sem } = req.query;
        const limit = parseInt(pageSize);
        const params = {
            sem,
            page,
            limit
        };
        const response = await axios.get(
            "http://localhost:8080/api/get-external-lotteries", { params }
        );

        if (!response.data.success) {
            return res
                .status(statusCode.badRequest)
                .send(apiResponseErr(null, false, statusCode.badRequest, 'Failed to fetch data'));
        }

        const { data, pagination } = response.data;

        const paginationData = {
            page: pagination?.page || page,
            totalPages: pagination?.totalPages || 1,
            totalItems: pagination?.totalItems || data.length,
            limit: pagination?.limit || limit
        };

        return res
            .status(statusCode.success)
            .send(
                apiResponseSuccess(
                    data,
                    true,
                    statusCode.success,
                    'Success',
                    paginationData
                ),
            );
    } catch (error) {
        res.status(statusCode.internalServerError).send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
    }

}
//Not Use
export const getUser = async (req, res) => {
    try {
        const users = await userSchema.findAll({
            attributes: ['userName', 'userId', 'balance']
        });
        return res
            .status(statusCode.success)
            .send(apiResponseSuccess(users, true, statusCode.success, 'User retrieve successfully'));
    } catch (error) {
        res.status(statusCode.internalServerError).send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
    }
}

export const purchaseLotteryTicket = async (req, res) => {
    try {
        const users = req.user
        const { lotteryId } = req.body;

        const response = await axios.get(
            `http://localhost:8080/api/getParticularLotteries/${lotteryId}`,
        );
        if (!response.data.success) {
            return res
                .status(statusCode.badRequest)
                .send(apiResponseErr(null, false, statusCode.badRequest, 'Failed to fetch data'));
        }
        const { data } = response.data;
        if (users.balance <= data) {
            return res
                .status(statusCode.badRequest)
                .send(apiResponseErr(null, false, statusCode.badRequest, 'Insufficient balance'));

        }
        users.balance = users.balance - data
        await users.save()

        const dataToSend = {
            userId: users.userId,
            lotteryId,
            userName: users.userName,
        }
        const purchaseRes = await axios.post(
            `http://localhost:8080/api/create-purchase-lottery`, dataToSend
        );

        if (!purchaseRes.data.success) {
            return res
                .status(statusCode.badRequest)
                .send(apiResponseErr(null, false, statusCode.badRequest, 'Failed to create'));
        }

        const updateBalance = {
            userId: users.userId,
            amount: users.balance
        }
        const updateWhiteLabelBalance = await axios.post(
            `http://localhost:8000/api/admin/extrnal/balance-update`, updateBalance
        );

        if (!updateWhiteLabelBalance.data.success) {
            return res
                .status(statusCode.badRequest)
                .send(apiResponseErr(null, false, statusCode.badRequest, 'Failed to update balance'));
        }

        return res
            .status(statusCode.success)
            .send(
                apiResponseSuccess(
                    null,
                    true,
                    statusCode.success,
                    'Lottery purchase successfully',
                ),
            );
    } catch (error) {
        console.error("Error from API:", error.response ? error.response.data : error.message);
        res.status(statusCode.internalServerError).send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
    }
};


export const getUserPurchases = async (req, res) => {
    try {
        const userId = req.user.userId

        const response = await axios.get(
            `http://localhost:8080/api/user-purchases/${userId}`,
        );

        if (!response.data.success) {
            return res
                .status(statusCode.badRequest)
                .send(apiResponseErr(null, false, statusCode.badRequest, 'Failed to fetch data'));
        }

        const { data } = response.data;


        return res
            .status(statusCode.success)
            .send(
                apiResponseSuccess(
                    data,
                    true,
                    statusCode.success,
                    'Success',
                ),
            );
    } catch (error) {
        res.status(statusCode.internalServerError).send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
    }
}
