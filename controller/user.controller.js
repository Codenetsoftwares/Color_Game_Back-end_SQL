import bcrypt from "bcrypt";
import {
  apiResponseErr,
  apiResponsePagination,
  apiResponseSuccess,
} from "../middleware/serverError.js";
import moment from "moment";
import { statusPanelCodes, string } from "../constructor/string.js";
import userSchema from "../models/user.model.js";
import { statusCode } from "../helper/statusCodes.js";
import Market from "../models/market.model.js";
import Runner from "../models/runner.model.js";
import { Op, Sequelize } from "sequelize";
import MarketBalance from "../models/marketBalance.js";
import CurrentOrder from "../models/currentOrder.model.js";
import Game from "../models/game.model.js";
import BetHistory from "../models/betHistory.model.js";
import ProfitLoss from "../models/profitLoss.js";
import { PreviousState } from "../models/previousState.model.js";
import axios from "axios";
import CustomError from "../helper/extendError.js";
import LotteryProfit_Loss from "../models/lotteryProfit_loss.model.js";

// done
export const createUser = async (req, res) => {
  const { userId, userName, password } = req.body;
  try {
    const existingUser = await userSchema.findOne({ where: { userName } });

    if (existingUser) {
      return res
        .status(statusCode.badRequest)
        .send(
          apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            "User already exists"
          )
        );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await userSchema.create({
      userId,
      userName,
      password: hashedPassword,
      roles: string.User,
    });

    return res
      .status(statusCode.create)
      .send(
        apiResponseSuccess(
          null,
          true,
          statusCode.create,
          "User created successfully"
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

// done
export const userUpdate = async (req, res) => {
  const { userId } = req.params;
  const { firstName, lastName, userName, phoneNumber, password } = req.body;

  try {
    const user = await userSchema.findOne({ where: { userId } });

    if (!user) {
      return res
        .status(statusCode.notFound)
        .send(
          apiResponseErr(null, false, statusCode.notFound, "User not found")
        );
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (userName) updateData.userName = userName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateData.password = hashedPassword;
    }

    await user.update(updateData);

    res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          null,
          true,
          statusCode.success,
          "User updated successfully"
        )
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
export const eligibilityCheck = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { eligibilityCheck } = req.body;

    const user = await userSchema.findOne({ where: { userId } });

    if (!user) {
      return res
        .status(statusCode.badRequest)
        .send(
          apiResponseErr(null, false, statusCode.badRequest, "User not found")
        );
    }

    user.eligibilityCheck = eligibilityCheck;
    await user.save();

    return res.status(200).json({
      message: eligibilityCheck ? "User Eligible" : "User Not Eligible",
    });
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
// DONE
export const resetPassword = async (req, res) => {
  try {
    const { oldPassword, password, confirmPassword } = req.body;
    const user = req.user;
    const userId = user.userId;

    if (password !== confirmPassword) {
      return res
        .status(statusCode.badRequest)
        .send(
          apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            "Confirm Password does not match with Password"
          )
        );
    }

    const userData = await userSchema.findOne({ where: { userId } });

    if (!userData) {
      return res
        .status(statusCode.notFound)
        .send(
          apiResponseErr(null, false, statusCode.badRequest, "User Not Found")
        );
    }

    const oldPasswordIsCorrect = await bcrypt.compare(
      oldPassword,
      userData.password
    );
    if (!oldPasswordIsCorrect) {
      return res
        .status(statusCode.badRequest)
        .send(
          apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            "Invalid old password"
          )
        );
    }

    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(password, salt);
    await userData.save();

    res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          null,
          true,
          statusCode.success,
          "Password Reset Successfully"
        )
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
export const userGame = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
    const searchQuery = req.query.search || "";

    const { count, rows } = await Game.findAndCountAll({
      attributes: ["gameId", "gameName", "description"],
      where: {
        gameName: {
          [Op.like]: `%${searchQuery}%`,
        },
      },
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });

    if (!rows || rows.length === 0) {
      return res
        .status(statusCode.success)
        .json(
          apiResponseSuccess([], false, statusCode.success, "Data Not Found")
        );
    }

    const gameData = rows.map((game) => ({
      gameId: game.gameId,
      gameName: game.gameName,
      description: game.description,
    }));

    const totalPages = Math.ceil(count / pageSize);

    const paginationData = apiResponsePagination(page, totalPages, count);

    return res
      .status(statusCode.success)
      .json(
        apiResponseSuccess(
          gameData,
          true,
          statusCode.success,
          "Success",
          paginationData
        )
      );
  } catch (error) {
    console.error("Error fetching games:", error);
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
export const userMarket = async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const searchQuery = req.query.search ? req.query.search.toLowerCase() : "";

    const { count, rows } = await Market.findAndCountAll({
      where: {
        gameId: gameId,
        marketName: {
          [Op.like]: `%${searchQuery}%`,
        },
      },
      offset: (page - 1) * pageSize,
      limit: pageSize,
      // include: [
      //   {
      //     model: Game,
      //     attributes: ['gameId', 'gameName'],
      //   },
      // ],
    });

    const totalPages = Math.ceil(count / pageSize);

    const paginationData = {
      currentPage: page,
      totalPages: totalPages,
      totalItems: count,
    };

    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          rows,
          true,
          statusCode.success,
          "Success",
          paginationData
        )
      );
  } catch (error) {
    console.error("Error fetching markets:", error);
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
export const userRunners = async (req, res) => {
  try {
    const marketId = req.params.marketId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const searchQuery = req.query.search || "";

    const whereConditions = {
      marketId: marketId,
      ...(searchQuery && {
        runnerName: {
          [Op.like]: `%${searchQuery}%`,
        },
      }),
    };

    const { rows: runners, count: totalItems } = await Runner.findAndCountAll({
      where: whereConditions,
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });

    const transformedRunners = runners.map((runner) => ({
      runnerId: runner.runnerId,
      runnerName: runner.runnerName,
      rates: [
        {
          back: runner.back,
          lay: runner.lay,
        },
      ],
    }));

    const totalPages = Math.ceil(totalItems / pageSize);

    const paginationData = apiResponsePagination(page, totalPages, totalItems);

    res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          transformedRunners,
          true,
          statusCode.success,
          "success",
          paginationData
        )
      );
  } catch (error) {
    console.error("Error fetching runners:", error);
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
export const getAllGameData = async (req, res) => {
  try {
    const gameData = await Game.findAll({
      attributes: ["gameId", "gameName", "description", "isBlink"],
      include: [
        {
          model: Market,
          attributes: [
            "marketId",
            "marketName",
            "participants",
            "startTime",
            "endTime",
            "announcementResult",
            "isActive",
            "hideMarketUser",
            "isVoid",
          ],
          include: [
            {
              model: Runner,
              attributes: [
                "runnerId",
                "runnerName",
                "isWin",
                "bal",
                "back",
                "lay",
                "hideRunnerUser",
              ],
            },
          ],
        },
      ],
    });

    const formattedGameData = gameData.map((game) => ({
      gameId: game.gameId,
      gameName: game.gameName,
      description: game.description,
      isBlink: game.isBlink,
      markets: game.Markets.filter(
        (market) => !market.hideMarketUser && !market.isVoid
      ).map((market) => ({
        marketId: market.marketId,
        marketName: market.marketName,
        participants: market.participants,
        startTime: market.startTime,
        endTime: market.endTime,
        announcementResult: market.announcementResult,
        isActive: market.isActive,
        isVoid: market.isVoid,
        runners: market.Runners.filter((runner) => !runner.hideRunnerUser).map(
          (runner) => ({
            runnerId: runner.runnerId,
            runnerName: runner.runnerName,
            isWin: runner.isWin,
            bal: runner.bal,
            rate: [
              {
                back: runner.back,
                lay: runner.lay,
              },
            ],
          })
        ),
      })),
    }));

    res
      .status(statusCode.success)
      .json(
        apiResponseSuccess(
          formattedGameData,
          true,
          statusCode.success,
          "Success"
        )
      );
  } catch (error) {
    console.error("Error retrieving game data:", error);
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
export const filteredGameData = async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const gameData = await Game.findAll({
      where: { gameId },
      attributes: ["gameId", "gameName", "description", "isBlink"],
      include: [
        {
          model: Market,
          attributes: [
            "marketId",
            "marketName",
            "participants",
            "startTime",
            "endTime",
            "announcementResult",
            "isActive",
          ],
          include: [
            {
              model: Runner,
              attributes: [
                "runnerId",
                "runnerName",
                "isWin",
                "bal",
                "back",
                "lay",
              ],
            },
          ],
        },
      ],
    });

    if (!gameData) {
      throw apiResponseErr(
        null,
        false,
        statusCode.badRequest,
        "Game not found"
      );
    }

    const formattedGameData = gameData.map((game) => ({
      gameId: game.gameId,
      gameName: game.gameName,
      description: game.description,
      isBlink: game.isBlink,
      markets: game.Markets.map((market) => ({
        marketId: market.marketId,
        marketName: market.marketName,
        participants: market.participants,
        startTime: market.startTime,
        endTime: market.endTime,
        announcementResult: market.announcementResult,
        isActive: market.isActive,
        runners: market.Runners.map((runner) => ({
          runnerName: {
            runnerId: runner.runnerId,
            runnerName: runner.runnerName,
            isWin: runner.isWin,
            bal: runner.bal,
          },
          rate: [
            {
              back: runner.back,
              lay: runner.lay,
            },
          ],
        })),
      })),
    }));

    // Send the formatted response
    res
      .status(statusCode.success)
      .json(
        apiResponseSuccess(
          formattedGameData,
          true,
          statusCode.success,
          "Success"
        )
      );
  } catch (error) {
    console.error("Error retrieving game data:", error);
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
export const userGif = async (req, res) => {
  try {
    const gifData = await gifSchema.findAll({
      attributes: ["imageId", "image", "text", "headingText", "isActive"],
    });

    res
      .status(statusCode.success)
      .send(apiResponseSuccess(gifData, true, statusCode.success, "success"));
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
export const getUserWallet = async (req, res) => {
  try {
    const userId = req.params.userId;

    const userData = await userSchema.findOne({ where: { userId } });

    if (!userData || userData.length === 0) {
      return res
        .status(statusCode.notFound)
        .send(
          apiResponseErr(null, false, statusCode.notFound, "User not found")
        );
    }

    const getBalance = {
      walletId: userData.walletId,
      balance: userData.balance,
      exposure: userData.exposure,
      marketListExposure: userData.marketListExposure,
    };

    res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(getBalance, true, statusCode.success, "success")
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
export const transactionDetails = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const { count, rows: transactionData } =
      await transactionRecord.findAndCountAll({
        where: { userId },
        limit: pageSize,
        offset: (page - 1) * pageSize,
        order: [["createdAt", "DESC"]],
      });

    if (count === 0) {
      throw apiResponseErr(
        null,
        statusCode.badRequest,
        false,
        "User Not Found or No Transactions Found"
      );
    }

    const totalItems = count;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginationData = apiResponsePagination(page, totalPages, totalItems);

    res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          transactionData,
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
          error.data ?? null,
          false,
          error.responseCode ?? statusCode.internalServerError,
          error.errMessage ?? error.message
        )
      );
  }
};
// done
export const filterMarketData = async (req, res) => {
  try {
    const marketId = req.params.marketId;
    const userId = req.body?.userId;

    // Fetch market data
    const marketDataRows = await Market.findAll({
      where: { marketId, hideMarketUser: false, isVoid: false },
      include: [
        {
          model: Runner,
          required: false,
        },
      ],
    });

    console.log("Market Data Rows:", marketDataRows);

    const markets = await Market.findOne({
      where: { marketId },
    });

    if (!markets) {
      return res
        .status(statusCode.success)
        .json(
          apiResponseSuccess(
            { runners: [] },
            false,
            statusCode.success,
            "No active markets"
          )
        );
    }

    if (markets.isVoid) {
      throw new CustomError(`Market is void`, null, 0, statusPanelCodes.void);
    }

    if (markets.hideMarketUser) {
      throw new CustomError(
        `Market is announcement`,
        null,
        0,
        statusPanelCodes.announcement
      );
    }

    let marketDataObj = {
      marketId: marketDataRows[0].marketId,
      marketName: marketDataRows[0].marketName,
      participants: marketDataRows[0].participants,
      startTime: marketDataRows[0].startTime,
      endTime: marketDataRows[0].endTime,
      announcementResult: marketDataRows[0].announcementResult,
      isActive: marketDataRows[0].isActive,
      runners: [],
    };

    // Initialize runner data
    marketDataRows[0].Runners.forEach((runner) => {
      marketDataObj.runners.push({
        id: runner.id,
        runnerName: {
          runnerId: runner.runnerId,
          name: runner.runnerName,
          isWin: runner.isWin,
          bal: Math.round(parseFloat(runner.bal)),
        },
        rate: [
          {
            back: runner.back,
            lay: runner.lay,
          },
        ],
      });
    });

    if (userId) {
      // Fetch current orders
      const currentOrdersRows = await CurrentOrder.findAll({
        where: {
          userId,
          marketId,
        },
      });

      // Calculate user market balance
      const userMarketBalance = {
        userId,
        marketId,
        runnerBalance: [],
      };

      marketDataObj.runners.forEach((runner) => {
        let runnerBalance = 0;
        currentOrdersRows.forEach((order) => {
          if (order.type === "back") {
            if (String(runner.runnerName.runnerId) === String(order.runnerId)) {
              runnerBalance += Number(order.bidAmount);
            } else {
              runnerBalance -= Number(order.value);
            }
          } else if (order.type === "lay") {
            if (String(runner.runnerName.runnerId) === String(order.runnerId)) {
              runnerBalance -= Number(order.bidAmount);
            } else {
              runnerBalance += Number(order.value);
            }
          }
        });

        userMarketBalance.runnerBalance.push({
          runnerId: runner.runnerName.runnerId,
          bal: runnerBalance,
        });

        // Update the runner balance in marketDataObj
        runner.runnerName.bal = runnerBalance;
      });

      // Clear existing MarketBalance entries for the user and market
      const deleteResult = await MarketBalance.destroy({
        where: {
          userId,
          marketId,
        },
      });

      console.log(
        `Deleted ${deleteResult} MarketBalance entries for userId ${userId} and marketId ${marketId}`
      );

      // Save or update the balances in MarketBalance
      for (const balance of userMarketBalance.runnerBalance) {
        await MarketBalance.create({
          userId,
          marketId,
          runnerId: balance.runnerId,
          bal: balance.bal,
        });
      }

      // Check if previous state should be shown
      const previousState = await PreviousState.findOne({
        where: { marketId, userId, isReverted: true },
      });

      if (previousState) {
        // Fetch previously stored balances from PreviousState
        const previousBalances = JSON.parse(previousState.allRunnerBalances);

        // Update the marketDataObj with previous balances
        marketDataObj.runners.forEach((runner) => {
          if (previousBalances[runner.runnerName.runnerId]) {
            runner.runnerName.bal =
              previousBalances[runner.runnerName.runnerId];
          }
        });
      }
    }

    return res
      .status(statusCode.success)
      .json(
        apiResponseSuccess(marketDataObj, true, statusCode.success, "Success")
      );
  } catch (error) {
    res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          error.data ?? null,
          false,
          error.responseCode ?? statusCode.internalServerError,
          error.errMessage ?? error.message,
          error.panelStatusCode ?? statusCode.internalServerError
        )
      );
  }
};

export const createBid = async (req, res) => {
  const {
    userId,
    gameId,
    marketId,
    runnerId,
    value,
    bidType,
    exposure,
    wallet,
    marketListExposure,
  } = req.body;
  try {
    if (!userId) {
      throw apiResponseErr(
        null,
        false,
        statusCode.badRequest,
        "User ID is required"
      );
    }
    if (value < 0) {
      throw apiResponseErr(
        null,
        false,
        statusCode.badRequest,
        "Bid value cannot be negative"
      );
    }
    if (value < 100) {
      throw apiResponseErr(
        null,
        false,
        statusCode.badRequest,
        "Bid value cannot be less than 100"
      );
    }
    const user = await userSchema.findOne({ where: { userId } });
    if (!user) {
      throw apiResponseErr(
        null,
        false,
        statusCode.badRequest,
        "User Not Found"
      );
    }
    if (user.balance < value) {
      throw apiResponseErr(
        null,
        false,
        statusCode.badRequest,
        "Insufficient balance. Bid cannot be placed."
      );
    }
    const game = await Game.findOne({
      where: { gameId },
      include: {
        model: Market,
        as: "Markets",
      },
    });
    if (!game) {
      throw apiResponseErr(
        null,
        false,
        statusCode.badRequest,
        "Game Not Found"
      );
    }
    const market = game.Markets.find(
      (market) => String(market.marketId) === String(marketId)
    );
    if (!market) {
      throw apiResponseErr(
        null,
        false,
        statusCode.badRequest,
        "Market Not Found"
      );
    }
    if (!market.isActive) {
      throw apiResponseErr(
        null,
        false,
        statusCode.badRequest,
        "Market is suspended. Bid cannot be placed."
      );
    }

    const runner = await Runner.findOne({ where: { marketId, runnerId } });
    if (!runner) {
      throw apiResponseErr(
        null,
        false,
        statusCode.badRequest,
        "Runner Not Found"
      );
    }
    const gameName = game.gameName;
    const marketName = market.marketName;
    const runnerName = runner.runnerName;
    const userName = user.userName;
    if (bidType === "back" || bidType === "lay") {
      const adjustedRate = runner[bidType.toLowerCase()] - 1;
      const mainValue = Math.round(adjustedRate * value);
      const betAmount = bidType === "back" ? value : mainValue;
      user.balance = wallet;
      user.exposure = exposure;
      user.marketListExposure = marketListExposure;
      await CurrentOrder.create({
        userId: userId,
        userName: userName,
        gameId: gameId,
        gameName: gameName,
        marketId: marketId,
        marketName: marketName,
        runnerId: runnerId,
        runnerName: runnerName,
        type: bidType,
        value: value,
        rate: runner[bidType.toLowerCase()],
        date: new Date(),
        bidAmount: mainValue,
        exposure: exposure,
      });
      await user.save();
    }

    const dataToSend = {
      amount: user.balance,
      userId: userId,
      exposure: exposure,
    };
    const baseURL = process.env.WHITE_LABEL_URL;
    const response = await axios.post(
      `${baseURL}/api/admin/extrnal/balance-update`,
      dataToSend
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

    await Runner.update({ isBidding: true }, { where: { marketId } });

    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          null,
          true,
          statusCode.success,
          "Bid placed successfully"
        )
      );
  } catch (error) {
    return res
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
export const getUserBetHistory = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.userId;
    const { gameId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { dataType, type } = req.query;

    let startDate, endDate;
    if (dataType === "live") {
      const today = new Date();
      startDate = new Date(today).setHours(0, 0, 0, 0);
      endDate = new Date(today).setHours(23, 59, 59, 999);
    } else if (dataType === "olddata") {
      if (req.query.startDate && req.query.endDate) {
        startDate = new Date(req.query.startDate).setHours(0, 0, 0, 0);
        endDate = new Date(req.query.endDate).setHours(23, 59, 59, 999);
      } else {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        startDate = new Date(oneYearAgo).setHours(0, 0, 0, 0);
        endDate = new Date().setHours(23, 59, 59, 999);
      }
    } else if (dataType === "backup") {
      if (req.query.startDate && req.query.endDate) {
        startDate = new Date(req.query.startDate).setHours(0, 0, 0, 0);
        endDate = new Date(req.query.endDate).setHours(23, 59, 59, 999);
        const maxAllowedDate = new Date(startDate);
        maxAllowedDate.setMonth(maxAllowedDate.getMonth() + 3);
        if (endDate > maxAllowedDate) {
          return res
            .status(statusCode.badRequest)
            .send(
              apiResponseErr(
                [],
                false,
                statusCode.badRequest,
                "The date range for backup data should not exceed 3 months."
              )
            );
        }
      } else {
        const today = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        startDate = new Date(threeMonthsAgo.setHours(0, 0, 0, 0));
        endDate = new Date(today.setHours(23, 59, 59, 999));
      }
    } else {
      return res
        .status(statusCode.success)
        .send(
          apiResponseSuccess([], true, statusCode.success, "Data not found.")
        );
    }

    const whereCondition = {
      userId: userId,
      gameId: gameId,
      date: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (type === "void") {
      whereCondition.isVoid = true;
    }

    const { count, rows } = await BetHistory.findAndCountAll({
      where: whereCondition,
      attributes: [
        "userId",
        "userName",
        "gameName",
        "marketName",
        "runnerName",
        "rate",
        "value",
        "type",
        "date",
        "matchDate",
        "placeDate",
      ],
      limit,
      offset: (page - 1) * limit,
    });

    const totalPages = Math.ceil(count / limit);
    const pageSize = limit;
    const totalItems = count;

    res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(rows, true, statusCode.success, "Success", {
          totalPages,
          pageSize,
          totalItems,
          page,
        })
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
// done
export const currentOrderHistory = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.userId;
    const gameId = req.params.gameId;
    // const page = parseInt(req.query.page, 10) || 1;
    // const limit = parseInt(req.query.limit, 10) || 5;

    if (!gameId) {
      return res
        .status(statusCode.badRequest)
        .send(
          apiResponseErr(
            null,
            statusCode.badRequest,
            false,
            "Game ID is required"
          )
        );
    }

    const { rows } = await CurrentOrder.findAndCountAll({
      where: {
        userId,
        gameId,
      },
      attributes: ["runnerName", "rate", "value", "type", "bidAmount"],
      // limit,
      // offset: (page - 1) * limit,
    });

    // const totalPages = Math.ceil(count / limit);
    // const pageSize = limit;
    // const totalItems = count;
    res
      .status(statusCode.success)
      .send(apiResponseSuccess(rows, true, statusCode.success, "Success"));
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

export const calculateProfitLoss = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const dataType = req.query.dataType;

    console.log("Received dataType:", dataType);

    let startDate, endDate;
    if (dataType === "live") {
      const today = new Date();
      startDate = new Date(today).setHours(0, 0, 0, 0);
      endDate = new Date(today).setHours(23, 59, 59, 999);
    } else if (dataType === "olddata") {
      if (req.query.startDate && req.query.endDate) {
        startDate = new Date(req.query.startDate).setHours(0, 0, 0, 0);
        endDate = new Date(req.query.endDate).setHours(23, 59, 59, 999);
      } else {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        startDate = new Date(oneYearAgo).setHours(0, 0, 0, 0);
        endDate = new Date().setHours(23, 59, 59, 999);
      }
    } else if (dataType === "backup") {
      if (req.query.startDate && req.query.endDate) {
        startDate = new Date(req.query.startDate).setHours(0, 0, 0, 0);
        endDate = new Date(req.query.endDate).setHours(23, 59, 59, 999);
        const maxAllowedDate = new Date(startDate);
        maxAllowedDate.setMonth(maxAllowedDate.getMonth() + 3);
        if (endDate > maxAllowedDate) {
          return res
            .status(statusCode.badRequest)
            .send(
              apiResponseErr(
                [],
                false,
                statusCode.badRequest,
                "The date range for backup data should not exceed 3 months."
              )
            );
        }
      } else {
        const today = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        startDate = new Date(threeMonthsAgo.setHours(0, 0, 0, 0));
        endDate = new Date(today.setHours(23, 59, 59, 999));
      }
    } else {
      return res
        .status(statusCode.success)
        .send(
          apiResponseSuccess([], true, statusCode.success, "Data not found.")
        );
    }

    const searchGameName = req.query.search || "";

    const profitLossData = await ProfitLoss.findAll({
      attributes: [
        "gameId",
        [Sequelize.fn("SUM", Sequelize.col("profitLoss")), "totalProfitLoss"],
      ],
      include: [
        {
          model: Game,
          attributes: ["gameName"],
          where: searchGameName
            ? { gameName: { [Op.like]: `%${searchGameName}%` } }
            : {},
        },
      ],
      where: {
        userId: userId,
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      group: ["gameId", "Game.gameName"],
      offset: (page - 1) * limit,
      limit: limit,
    });

    const lotteryProfitLossData = await LotteryProfit_Loss.findAll({
      attributes: [
        [Sequelize.fn("SUM", Sequelize.col("profitLoss")), "totalProfitLoss"],
      ],
      where: {
        userId: userId,
      },
    });

    if (profitLossData.length === 0 && lotteryProfitLossData.length === 0) {
      return res
        .status(statusCode.success)
        .send(
          apiResponseSuccess(
            [],
            true,
            statusCode.success,
            "No profit/loss data found for the given date range."
          )
        );
    }

    const combinedProfitLossData = [
      ...profitLossData.map((item) => ({
        gameId: item.gameId,
        gameName: item.Game.gameName,
        totalProfitLoss: item.dataValues.totalProfitLoss,
      })),
      ...lotteryProfitLossData
        .filter((item) => item.dataValues.totalProfitLoss !== null && item.dataValues.totalProfitLoss !== undefined && item.dataValues.totalProfitLoss !== "")
        .map((item) => ({
          gameName: "Lottery",
          totalProfitLoss: item.dataValues.totalProfitLoss,
        })),
    ];

    const totalItems = combinedProfitLossData.length;
    const totalPages = Math.ceil(totalItems / limit);
    const paginatedCombinedData = combinedProfitLossData.slice(
      (page - 1) * limit,
      page * limit
    );

    const paginationData = {
      page: page,
      limit,
      totalPages: totalPages,
      totalItems,
    };

    return res.status(statusCode.success).send(
      apiResponseSuccess(
        paginatedCombinedData, 
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
          error.responseCode || statusCode.internalServerError,
          error.errMessage || error.message
        )
      );
  }
};

export const marketProfitLoss = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.userId;
    const gameId = req.params.gameId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const searchMarketName = req.query.search || "";

    const distinctMarketIds = await ProfitLoss.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("marketId")), "marketId"],
      ],
      where: { userId: userId, gameId: gameId },
    });

    if (distinctMarketIds.length === 0) {
      return res
        .status(statusCode.success)
        .send(
          apiResponseSuccess(
            [],
            true,
            statusCode.success,
            "No profit/loss data found."
          )
        );
    }

    const marketsProfitLoss = await Promise.all(
      distinctMarketIds.map(async (market) => {
        const profitLossEntries = await ProfitLoss.findAll({
          attributes: [
            "marketId",
            [
              Sequelize.literal("CAST(profitLoss AS DECIMAL(10, 2))"),
              "profitLoss",
            ],
          ],
          where: {
            userId: userId,
            marketId: market.marketId,
          },
        });

        if (profitLossEntries.length === 0) {
          return res
            .status(statusCode.success)
            .send(
              apiResponseSuccess(
                [],
                true,
                statusCode.success,
                "No profit/loss data found for the given date range."
              )
            );
        }

        const marketQuery = {
          marketId: market.marketId,
        };

        if (searchMarketName) {
          marketQuery.marketName = { [Op.like]: `%${searchMarketName}%` };
        }

        const game = await Game.findOne({
          include: [
            {
              model: Market,
              where: marketQuery,
              attributes: ["marketName"],
            },
          ],
          attributes: ["gameName"],
          where: { gameId: gameId },
        });

        if (!game) return null;

        const gameName = game.gameName;
        const marketName = game.Markets[0].marketName;
        const totalProfitLoss = profitLossEntries.reduce(
          (acc, entry) => acc + parseFloat(entry.profitLoss),
          0
        );

        const formattedTotalProfitLoss = totalProfitLoss.toFixed(2);

        return {
          marketId: market.marketId,
          marketName,
          gameName,
          totalProfitLoss: formattedTotalProfitLoss,
        };
      })
    );
    const filteredMarketsProfitLoss = marketsProfitLoss.filter(
      (item) => item !== null
    );

    if (filteredMarketsProfitLoss.length === 0) {
      return res
        .status(statusCode.success)
        .send(
          apiResponseSuccess(
            [],
            true,
            statusCode.success,
            "No matching markets found."
          )
        );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedProfitLossData = filteredMarketsProfitLoss.slice(
      startIndex,
      endIndex
    );
    const totalItems = filteredMarketsProfitLoss.length;
    const totalPages = Math.ceil(totalItems / limit);

    const paginationData = {
      page: page,
      totalPages: totalPages,
      totalItems: totalItems,
    };

    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          paginatedProfitLossData,
          true,
          statusCode.success,
          "Success",
          paginationData
        )
      );
  } catch (error) {
    console.error("Error from API:", error.message);
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

export const runnerProfitLoss = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.userId;
    const marketId = req.params.marketId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const searchRunnerName = req.query.search || "";

    const profitLossEntries = await ProfitLoss.findAll({
      where: {
        userId: userId,
        marketId: marketId,
      },
    });

    if (profitLossEntries.length === 0) {
      return res
        .status(statusCode.success)
        .send(
          apiResponseSuccess(
            [],
            true,
            statusCode.success,
            "No profit/loss data found for the given date range."
          )
        );
    }

    const runnersProfitLoss = await Promise.all(
      profitLossEntries.map(async (entry) => {
        const game = await Game.findOne({
          where: { gameId: entry.gameId },
          include: [
            {
              model: Market,
              where: { marketId: marketId },
              include: [
                {
                  model: Runner,
                  where: searchRunnerName
                    ? { runnerName: { [Op.like]: `%${searchRunnerName}%` } }
                    : {},
                },
              ],
            },
          ],
        });

        if (!game) return null;

        const market = game.Markets[0];
        const runner = market.Runners.find(
          (runner) => runner.runnerId === entry.runnerId
        );

        if (!runner) {
          return apiResponseErr(
            null,
            false,
            statusCode.badRequest,
            `Runner data not found for runnerId: ${entry.runnerId}`
          );
        }

        return {
          gameName: game.gameName,
          marketName: market.marketName,
          runnerName: runner.runnerName,
          runnerId: entry.runnerId,
          profitLoss: parseFloat(entry.profitLoss).toFixed(2),
          isWin: runner.isWin,
          settleTime: entry.date.toISOString(),
        };
      })
    );

    const filteredRunnersProfitLoss = runnersProfitLoss.filter(
      (item) => item !== null
    );

    if (filteredRunnersProfitLoss.length === 0) {
      return res
        .status(statusCode.success)
        .send(
          apiResponseSuccess(
            [],
            true,
            statusCode.success,
            "No matching runners found."
          )
        );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedRunnersProfitLoss = filteredRunnersProfitLoss.slice(
      startIndex,
      endIndex
    );
    const totalItems = filteredRunnersProfitLoss.length;
    const totalPages = Math.ceil(totalItems / limit);

    const paginationData = {
      page: page,
      totalPages: totalPages,
      totalItems: totalItems,
    };

    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          paginatedRunnersProfitLoss,
          true,
          statusCode.success,
          "Success",
          paginationData
        )
      );
  } catch (error) {
    console.error("Error from API:", error.message);
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

export const userMarketData = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.userId;

    const getCurrentMarket = await CurrentOrder.findAll({
      where: { userId },
      include: [
        { model: Market, as: "market", attributes: ["marketId", "marketName"] },
      ],
    });

    const currentMarketSet = new Set();

    getCurrentMarket.forEach((item) => {
      currentMarketSet.add(
        JSON.stringify({
          marketId: item.market.marketId,
          marketName: item.market.marketName,
        })
      );
    });

    const currentMarketArray = Array.from(currentMarketSet).map((item) =>
      JSON.parse(item)
    );

    const getBetHistory = await BetHistory.findAll({
      where: { userId },
      include: [
        { model: Market, as: "market", attributes: ["marketId", "marketName"] },
      ],
    });

    const betHistorySet = new Set();

    getBetHistory.forEach((item) => {
      betHistorySet.add(
        JSON.stringify({
          marketId: item.market.marketId,
          marketName: item.market.marketName,
        })
      );
    });

    const betHistoryArray = Array.from(betHistorySet).map((item) =>
      JSON.parse(item)
    );

    const responseData = {
      currentMarket: currentMarketArray,
      betHistory: betHistoryArray,
    };

    res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(responseData, true, statusCode.success, "Success")
      );
  } catch (error) {
    console.error("Error fetching user market data:", error);
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

export const userBetHistoryGames = async (req, res) => {
  try {
    const distinctGames = await BetHistory.findAll({
      attributes: ["gameId", "gameName"],
      group: ["gameId", "gameName"],
    });

    res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(distinctGames, true, statusCode.success, "Success")
      );
  } catch (error) {
    console.error("Error fetching user market data:", error);
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

export const accountStatement = async (req, res) => {
  try {
    console.log("................................");
    const userName = req.user.userName;
    const { page = 1, pageSize = 10, startDate, endDate } = req.query;
    const dataType = req.query.dataType;

    const params = {
      userName,
      startDate,
      endDate,
      pageSize,
      page,
      dataType,
    };
    const baseURL = process.env.WHITE_LABEL_URL;
    console.log("baseURl...............", baseURL);
    const response = await axios.get(
      `${baseURL}/api/user-colorGame-account-statement/${userName}`,
      { params }
    );
    console.log("response response", response);
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
      limit: pagination?.limit,
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

export const getUserBetList = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.userId;
    const runnerId = req.params.runnerId;

    const rows = await BetHistory.findAll({
      where: {
        userId: userId,
        runnerId: runnerId,
      },
      attributes: [
        "userId",
        "userName",
        "gameName",
        "marketName",
        "runnerName",
        "rate",
        "value",
        "type",
        "matchDate",
        "placeDate",
        "bidAmount",
      ],
    });

    res
      .status(statusCode.success)
      .send(apiResponseSuccess(rows, true, statusCode.success, "Success"));
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

export const getUserCurrentOrderGames = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.userId;

    const distinctGames = await CurrentOrder.findAll({
      where: { userId },
      attributes: ["gameId", "gameName"],
      group: ["gameId", "gameName"],
    });

    res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(distinctGames, true, statusCode.success, "Success")
      );
  } catch (error) {
    console.error("Error fetching user market data:", error);
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

export const activityLog = async (req, res) => {
  try {
    const user = req.user;
    const loginDateTime = user.lastLoginTime;
    const loginStatus = user.loginStatus;
    let clientIP = req.ip;
    const forwardedFor = req.headers["x-forwarded-for"];
    if (forwardedFor) {
      const forwardedIps = forwardedFor.split(",");
      clientIP = forwardedIps[0].trim();
    }
    const data = await fetch(`http://ip-api.com/json/${clientIP}`);
    const collect = await data.json();

    const logData = {
      loginDateTime,
      loginStatus,
      ip: {
        iP: clientIP,
        country: collect.country,
        region: collect.regionName,
        timezone: collect.timezone,
        isp: collect.isp,
      },
    };

    res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          logData,
          true,
          statusCode.success,
          "Login activity logged successfully."
        )
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
