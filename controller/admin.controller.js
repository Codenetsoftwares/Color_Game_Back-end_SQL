import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import {
  apiResponseErr,
  apiResponseSuccess,
} from "../middleware/serverError.js";
import { statusCode } from "../helper/statusCodes.js";
import admins from "../models/admin.model.js";
import { string } from "../constructor/string.js";
import marketSchema from "../models/market.model.js";
import userSchema from "../models/user.model.js";
import Sequelize from "../db.js";
import transactionRecord from "../models/transactionRecord.model.js";
import Runner from "../models/runner.model.js";
import Market from "../models/market.model.js";
import MarketBalance from "../models/marketBalance.js";
import ProfitLoss from "../models/profitLoss.js";
import CurrentOrder from "../models/currentOrder.model.js";
import BetHistory from "../models/betHistory.model.js";
import { Op } from "sequelize";
import axios from "axios";
import Game from "../models/game.model.js";

dotenv.config();
const globalName = [];
// done
export const createAdmin = async (req, res) => {
  const { userName, password } = req.body;
  try {
    const existingAdmin = await admins.findOne({ where: { userName } });

    if (existingAdmin) {
      return res
        .status(statusCode.badRequest)
        .json(
          apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            "Admin already exists"
          )
        );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = await admins.create({
      adminId: uuidv4(),
      userName,
      password: hashedPassword,
      roles: string.Admin,
    });

    return res
      .status(statusCode.create)
      .json(
        apiResponseSuccess(
          null,
          true,
          statusCode.create,
          "Admin created successfully"
        )
      );
  } catch (error) {
    return res
      .status(statusCode.internalServerError)
      .json(
        apiResponseErr(
          error.data ?? null,
          false,
          error.responseCode ?? statusCode.internalServerError,
          error.errMessage ?? error.message
        )
      );
  }
};
// done
export const checkMarketStatus = async (req, res) => {
  const marketId = req.params.marketId;
  const { status } = req.body;

  try {
    const market = await marketSchema.findOne({ where: { marketId } });

    if (!market) {
      return res
        .status(statusCode.notFound)
        .json(
          apiResponseErr(null, false, statusCode.notFound, "Market not found")
        );
    }

    market.isActive = status;
    await market.save();

    const statusMessage = status ? "Market is active" : "Market is suspended";
    res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(statusMessage, true, statusCode.success, "success")
      );
  } catch (error) {
    res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          error.data ?? null,
          false,
          error.responseCode ?? statusCode.internalServerError,
          error.errMessage ?? error.message
        )
      );
  }
};
// done
export const getAllUsers = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
    const searchQuery = req.query.search ? req.query.search.toLowerCase() : "";

    const countQuery = await userSchema.count({
      where: {
        userName: { [Op.like]: `%${searchQuery}%` },
      },
    });
    const totalItems = countQuery;

    const totalPages = Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;

    const users = await userSchema.findAll({
      where: {
        userName: { [Op.like]: `%${searchQuery}%` },
      },
      limit: pageSize,
      offset: offset,
    });

    if (!users || users.length === 0) {
      throw apiResponseErr(
        null,
        false,
        statusCode.badRequest,
        "User not found"
      );
    }

    const paginationData = {
      page,
      totalPages,
      totalItems,
    };

    return res
      .status(statusCode.success)
      .json(
        apiResponseSuccess(
          users,
          true,
          statusCode.success,
          "success",
          paginationData
        )
      );
  } catch (error) {
    console.log(error);
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
// Done
export const deposit = async (req, res) => {
  try {
    const { adminId, depositAmount } = req.body;

    const existingAdmin = await admins.findOne({ where: { adminId } });

    if (!existingAdmin) {
      return res
        .status(statusCode.notFound)
        .json(
          apiResponseErr(null, false, statusCode.notFound, "Admin Not Found")
        );
    }

    const parsedDepositAmount = parseFloat(depositAmount);

    await existingAdmin.increment("balance", { by: parsedDepositAmount });

    const updatedAdmin = await admins.findOne({ where: { adminId } });

    if (!updatedAdmin) {
      throw new Error("Failed to fetch updated admin");
    }

    const newAdmin = {
      adminId: updatedAdmin.adminId,
      walletId: updatedAdmin.walletId,
      balance: updatedAdmin.balance,
    };

    return res
      .status(statusCode.create)
      .json(
        apiResponseSuccess(
          newAdmin,
          true,
          statusCode.create,
          "Deposit balance successful"
        )
      );
  } catch (error) {
    console.error("Error depositing balance:", error);
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
// done
export const sendBalance = async (req, res) => {
  try {
    const { balance, adminId, userId } = req.body;

    const admin = await admins.findOne({ where: { adminId } });
    if (!admin) {
      return res
        .status(statusCode.badRequest)
        .json(
          apiResponseErr(null, false, statusCode.badRequest, "Admin Not Found")
        );
    }

    const user = await userSchema.findOne({ where: { userId } });
    if (!user) {
      return res
        .status(statusCode.badRequest)
        .json(
          apiResponseErr(null, false, statusCode.badRequest, "User Not Found")
        );
    }

    const parsedDepositAmount = parseFloat(balance);
    if (isNaN(parsedDepositAmount)) {
      return res
        .status(statusCode.badRequest)
        .json(
          apiResponseErr(null, false, statusCode.badRequest, "Invalid Balance")
        );
    }

    if (admin.balance < parsedDepositAmount) {
      return res
        .status(statusCode.badRequest)
        .json(
          apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            "Insufficient Balance For Transfer"
          )
        );
    }

    await Sequelize.transaction(async (t) => {
      await admins.update(
        { balance: Sequelize.literal(`balance - ${parsedDepositAmount}`) },
        { where: { adminId }, transaction: t }
      );

      await userSchema.update(
        {
          balance: Sequelize.literal(`balance + ${parsedDepositAmount}`),
          walletId: user.walletId,
        },
        { where: { userId }, transaction: t }
      );

      await transactionRecord.create(
        {
          userId,
          transactionType: "credit",
          amount: parsedDepositAmount,
          date: Date.now(),
        },
        { transaction: t }
      );
    });

    const successResponse = {
      userId,
      balance: user.balance,
      walletId: user.walletId,
    };
    return res
      .status(statusCode.create)
      .json(
        apiResponseSuccess(
          null,
          true,
          statusCode.create,
          "Send balance to User successful"
        )
      );
  } catch (error) {
    console.error("Error sending balance:", error);
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

export const afterWining = async (req, res) => {
  try {
    const { marketId, runnerId, isWin } = req.body;
    let gameId = null;

    const market = await Market.findOne({
      where: { marketId },
      include: [{ model: Runner, required: false }],
    });

    if (!market) {
      return res
        .status(statusCode.badRequest)
        .json(
          apiResponseErr(null, false, statusCode.badRequest, "Market not found")
        );
    }

    gameId = market.gameId;

    if (market.runners) {
      market.runners.forEach((runner) => {
        if (String(runner.runnerId) === runnerId) {
          runner.isWin = isWin;
        } else {
          runner.isWin = false;
        }
      });
    }

    if (isWin) {
      market.announcementResult = true;
    }

    await market.save();

    const users = await MarketBalance.findAll({
      where: { marketId },
    });
    let message = "";
    for (const user of users) {
      try {
        const runnerBalance = await MarketBalance.findOne({
          where: { marketId, runnerId, userId: user.userId },
        });

        if (runnerBalance) {
          const userDetails = await userSchema.findOne({
            where: { userId: user.userId },
          });

          if (userDetails) {
            const marketExposureEntry = userDetails.marketListExposure.find(
              (item) => Object.keys(item)[0] === marketId
            );
            if (marketExposureEntry) {
              const marketExposureValue = Number(marketExposureEntry[marketId]);
              const runnerBalanceValue = Number(runnerBalance.bal);

              if (isWin) {
                userDetails.balance += runnerBalanceValue + marketExposureValue;
              } else {
                console.log(
                  `No win. Balance remains the same: ${userDetails.balance}`
                );
              }

              await ProfitLoss.create({
                userId: user.userId,
                gameId,
                marketId,
                runnerId,
                date: new Date(),
                profitLoss: runnerBalanceValue,
              });

              userDetails.marketListExposure =
                userDetails.marketListExposure.filter(
                  (item) => Object.keys(item)[0] !== marketId
                );

              await userSchema.update(
                { marketListExposure: userDetails.marketListExposure },
                { where: { userId: user.userId } }
              );

              await userDetails.save();
              // sync with whiteLable

              const dataToSend = {
                amount: userDetails.balance,
                userId: userDetails.userId,
              };
              console.log("data", dataToSend);
              const { data: response } = await axios.post(
                "https://wl.server.dummydoma.in/api/admin/extrnal/balance-update",
                dataToSend
              );

              // console.log('Reset password response:', response.data);

              if (!response.success) {
                message = "Sync not successful";
              } else {
                message = "Sync data successful";
              }

              await MarketBalance.destroy({
                where: { marketId, runnerId, userId: user.userId },
              });
            } else {
              console.error(
                `Market exposure not found for marketId ${marketId}`
              );
            }
          } else {
            console.error(`User details not found for userId ${user.userId}`);
          }
        } else {
          console.error(
            `Runner balance not found for marketId ${marketId} and runnerId ${runnerId}`
          );
        }
      } catch (error) {
        console.error("Error processing user:", error);
      }
    }

    if (isWin) {
      const orders = await CurrentOrder.findAll({
        where: { marketId },
      });

      for (const order of orders) {
        await BetHistory.create({
          userId: order.userId,
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
          bidAmount: order.bidAmount,
          isWin: order.isWin,
          profitLoss: order.profitLoss,
        });
      }

      await CurrentOrder.destroy({
        where: { marketId },
      });
    }

    return res
      .status(statusCode.success)
      .json(
        apiResponseSuccess(
          null,
          true,
          statusCode.success,
          "Success" + " " + message
        )
      );
  } catch (error) {
    console.error("Error sending balance:", error);
    return res
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

// Authenticate by user Password

export const updateByAdmin = async (req, res) => {
  try {
    const {
      amount,
      userId,
      type,
      transactionId,
      transactionType,
      date,
      remarks,
      transferFromUserAccount,
      transferToUserAccount,
    } = req.body;

    const user = await userSchema.findOne({ where: { userId } });
    if (!user) {
      return res
        .status(statusCode.badRequest)
        .json(
          apiResponseErr(null, false, statusCode.badRequest, "User Not Found")
        );
    }

    const currentAmount = type === "credit" ? amount : -amount;

    await userSchema.update(
      { balance: user.balance + currentAmount },
      { where: { userId } }
    );

    const createTransaction = await transactionRecord.create({
      userId: userId,
      transactionId: transactionId,
      transactionType: transactionType,
      amount: amount,
      date: date,
      remarks: remarks,
      trDone: "wl",
      transferFromUserAccount: transferFromUserAccount,
      transferToUserAccount: transferToUserAccount,
    });
    console.log("uddbvbdvb", createTransaction);
    if (!createTransaction) {
      return res
        .status(statusCode.badRequest)
        .send(
          apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            "Failed to create transaction"
          )
        );
    }

    return res
      .status(statusCode.success)
      .json(
        apiResponseSuccess(
          null,
          true,
          statusCode.success,
          "Balance updated successful"
        )
      );
  } catch (error) {
    console.error("Error sending balance:", error);
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

export const buildRootPath = async (req, res) => {
  try {
    const { action } = req.params;
    const { name } = req.query;
    let data;

    // Find user based on the name
    data = await Game.findOne({ where: { gameName: name } }) ||
           await Market.findOne({ where: { marketName: name } }) ||
           await Runner.findOne({ where: { runnerName: name } });

    if (!data) {
      return res.status(statusCode.success).json(
        apiResponseErr(null, false, statusCode.badRequest, "Data not found for the specified criteria")
      );
    }

    const identifier = data instanceof Game ? data.gameId
                          : data instanceof Market ? data.marketId
                          : data.runnerId;

    // Map name to identifier in an array format
    const nameIdMap = globalName.map(item => ({ name: item.name, id: item.id }));

    if (action === "store") {
      const newPath = { name, id: identifier };
      const indexToRemove = globalName.findIndex(item => item.name === newPath.name);

      if (indexToRemove !== -1) {
        globalName.splice(indexToRemove + 1); // Remove elements after the found index
      } else {
        globalName.push(newPath); // Add new path
      }

      // Update user's path
      await data.update({ path: JSON.stringify(globalName) });

      return res.status(statusCode.success).json(
        apiResponseSuccess(globalName, true, statusCode.success, "Path stored successfully")
      );
    } else if (action === "clear") {
      const lastItem = globalName.pop();

      if (lastItem) {
        const indexToRemove = globalName.findIndex(item => item.name === lastItem.name);

        if (indexToRemove !== -1) {
          globalName.splice(indexToRemove, 1); // Remove specific element
        }
      }
    } else if (action === "clearAll") {
      globalName.length = 0; // Clear the entire array
    } else {
      return res.status(statusCode.badRequest).json(
        apiResponseErr(null, false, statusCode.badRequest, "Invalid action provided")
      );
    }

    // Update user's path after clear or clearAll actions
    await data.update({ path: JSON.stringify(globalName) });

    const successMessage = action === "store" ? "Path stored successfully" : "Path cleared successfully";
    return res.status(statusCode.success).json(
      apiResponseSuccess(globalName, true, statusCode.success, successMessage)
    );
  } catch (error) {
    console.error('Error occurred:', error); // Log error for debugging
    return res.status(statusCode.internalServerError).json(
      apiResponseErr(null, false, statusCode.internalServerError, error.message)
    );
  }
};

