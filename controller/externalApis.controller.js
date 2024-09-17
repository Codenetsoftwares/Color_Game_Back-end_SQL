import { apiResponseErr, apiResponseSuccess } from '../middleware/serverError.js';
import moment from 'moment';
import { statusCode } from '../helper/statusCodes.js';
import BetHistory from '../models/betHistory.model.js';
import Market from '../models/market.model.js';
import Runner from '../models/runner.model.js';
import { Op, Sequelize } from 'sequelize';
import Game from '../models/game.model.js';
import ProfitLoss from '../models/profitLoss.js';

export const getExternalUserBetHistory = async (req, res) => {
  try {
    const { gameId, userName } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const dataType = req.query.dataType; 
    let startDate, endDate;
    if (dataType === 'live') {
      const today = new Date();
      startDate = new Date(today).setHours(0, 0, 0, 0);
      endDate = new Date(today).setHours(23, 59, 59, 999);
    }else if (dataType === 'olddata') {
      if(req.query.startDate && req.query.endDate){
        startDate = new Date(req.query.startDate).setHours(0, 0, 0, 0);
        endDate = new Date(req.query.endDate   ).setHours(23, 59, 59, 999); 
      }else{
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      startDate = new Date(oneYearAgo).setHours(0, 0, 0, 0);
      endDate = new Date().setHours(23, 59, 59, 999);
      }   
    }else if (dataType === 'backup') {
      if (req.query.startDate && req.query.endDate) {
          startDate = new Date(req.query.startDate).setHours(0, 0, 0, 0);
          endDate = new Date(req.query.endDate).setHours(23, 59, 59, 999);
          const maxAllowedDate = new Date(startDate);
          maxAllowedDate.setMonth(maxAllowedDate.getMonth() + 3);
          if (endDate > maxAllowedDate) {
            return res.status(statusCode.badRequest)
            .send(apiResponseErr([], false, statusCode.badRequest, 'The date range for backup data should not exceed 3 months.'));
        }
      }else {
        const today = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(today.getMonth() - 3); 
        startDate = new Date(threeMonthsAgo.setHours(0, 0, 0, 0)); 
        endDate = new Date(today.setHours(23, 59, 59, 999)); 
      }
    } else {
      return res.status(statusCode.badRequest)
        .send(apiResponseErr([], false, statusCode.badRequest, 'Invalid dataType parameter.'));
    }

    const { count, rows } = await BetHistory.findAndCountAll({
      where: {
        userName: userName,
        gameId: gameId,
        date: {
          [Op.between]: [startDate, endDate],
        }
      },
      attributes: ['userName', 'gameName', 'marketName', 'runnerName', 'rate', 'value', 'type', 'date'],
      limit,
      offset: (page - 1) * limit,
    });

    const totalPages = Math.ceil(count / limit);
    const pageSize = limit;
    const totalItems = count;

    res.status(statusCode.success).send(apiResponseSuccess(
      rows,
      true,
      statusCode.success,
      'Success',
      { totalPages, pageSize, totalItems, page }
    ));
  } catch (error) {
    res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          null,
          false,
          statusCode.internalServerError,
          error.message,
        ),
      );
  }
};

export const  calculateExternalProfitLoss = async (req, res) => {
  try {
    const userName = req.params.userName;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const dataType = req.query.dataType; 
    let startDate, endDate;
    if (dataType === 'live') {
      const today = new Date();
      startDate = new Date(today).setHours(0, 0, 0, 0);
      endDate = new Date(today).setHours(23, 59, 59, 999);
    }else if (dataType === 'olddata') {
      if(req.query.startDate && req.query.endDate){
        startDate = new Date(req.query.startDate).setHours(0, 0, 0, 0);
        endDate = new Date(req.query.endDate   ).setHours(23, 59, 59, 999); 
      }else{
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      startDate = new Date(oneYearAgo).setHours(0, 0, 0, 0);
      endDate = new Date().setHours(23, 59, 59, 999);
      }   
    }else if (dataType === 'backup') {
      if (req.query.startDate && req.query.endDate) {
          startDate = new Date(req.query.startDate).setHours(0, 0, 0, 0);
          endDate = new Date(req.query.endDate).setHours(23, 59, 59, 999);
          const maxAllowedDate = new Date(startDate);
          maxAllowedDate.setMonth(maxAllowedDate.getMonth() + 3);
          if (endDate > maxAllowedDate) {
            return res.status(statusCode.badRequest)
            .send(apiResponseErr([], false, statusCode.badRequest, 'The date range for backup data should not exceed 3 months.'));
        }
      }else {
        const today = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(today.getMonth() - 2); 
        startDate = new Date(threeMonthsAgo.setHours(0, 0, 0, 0)); 
        endDate = new Date(today.setHours(23, 59, 59, 999)); 
      }
    } else {
      return res.status(statusCode.badRequest)
        .send(apiResponseErr([], false, statusCode.badRequest, 'Invalid dataType parameter.'));
    }
    const searchGameName = req.query.search || '';

    const totalGames = await ProfitLoss.count({
      where: {
        userName: userName,
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      distinct: true,
      col: 'gameId'
    });
     console.log("totalGames............", totalGames)

    const profitLossData = await ProfitLoss.findAll({
      attributes: [
        'gameId',
        [Sequelize.fn('SUM', Sequelize.col('profitLoss')), 'totalProfitLoss'],
      ],
      include: [
        {
          model: Game,
          attributes: ['gameName'],
          where: searchGameName ? { gameName: { [Op.like]: `%${searchGameName}%` } } : {},
        },
      ],
      where: {
        userName: userName,
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      group: ['gameId', 'Game.gameName'],
      offset: (page - 1) * limit,
      limit: limit,
    });

       console.log("profitLossData.............",profitLossData)
    if (profitLossData.length === 0) {
      return res
        .status(statusCode.success)
        .send(apiResponseSuccess([], true, statusCode.success, 'No profit/loss data found for the given date range.'));
    }

    const totalPages = Math.ceil(totalGames / limit);
    console.log("totalPages..................",totalPages)

    const paginationData = {
      page: page,
      limit: limit,
      totalPages: totalPages,
      totalItems: totalGames,
      
    };

    const formattedProfitLossData = profitLossData.map((item) => ({
      gameId: item.gameId,
      gameName: item.Game.gameName,
      totalProfitLoss: item.dataValues.totalProfitLoss,
    }));

    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          formattedProfitLossData,
          true,
          statusCode.success,
          'Success',
          paginationData,
        ),
      );
  } catch (error) {
    res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          null,
          false,
          statusCode.internalServerError,
          error.message,
        ),
      );
  }
};

export const marketExternalProfitLoss = async (req, res) => {
  try {
    const { gameId, userName } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const searchMarketName = req.query.search || '';

    const distinctMarketIds = await ProfitLoss.findAll({
      attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('marketId')), 'marketId']
      ],
      where: { userName: userName, gameId: gameId }
    });

    if (distinctMarketIds.length === 0) {
      return res
        .status(statusCode.success)
        .send(apiResponseSuccess([], true, statusCode.success, 'No profit/loss data found.'));
    }

    const marketsProfitLoss = await Promise.all(distinctMarketIds.map(async market => {
      const profitLossEntries = await ProfitLoss.findAll({
        attributes: [
          'marketId',
          [Sequelize.literal('CAST(profitLoss AS DECIMAL(10, 2))'), 'profitLoss']
        ],
        where: {
          userName: userName,
          marketId: market.marketId,
        }
      });

      if (profitLossEntries.length === 0) {
        return res
          .status(statusCode.success)
          .send(apiResponseSuccess([], true, statusCode.success, 'No profit/loss data found for the given date range.'));
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
            attributes: ['marketName']
          }
        ],
        attributes: ['gameName'],
        where: { gameId: gameId }
      });

      if (!game) return null

      const gameName = game.gameName;
      const marketName = game.Markets[0].marketName;
      const totalProfitLoss = profitLossEntries.reduce((acc, entry) => acc + parseFloat(entry.profitLoss), 0);

      const formattedTotalProfitLoss = totalProfitLoss.toFixed(2);

      return { marketId: market.marketId, marketName, gameName, totalProfitLoss: formattedTotalProfitLoss };
    }));
    const filteredMarketsProfitLoss = marketsProfitLoss.filter(item => item !== null);

    if (filteredMarketsProfitLoss.length === 0) {
      return res
        .status(statusCode.success)
        .send(apiResponseSuccess([], true, statusCode.success, 'No matching markets found.'));
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedProfitLossData = filteredMarketsProfitLoss.slice(startIndex, endIndex);
    const totalItems = filteredMarketsProfitLoss.length;
    const totalPages = Math.ceil(totalItems / limit);

    const paginationData = {
      page: page,
      totalPages: totalPages,
      totalItems: totalItems
    };

    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          paginatedProfitLossData,
          true,
          statusCode.success,
          'Success',
          paginationData,
        ),
      );
  } catch (error) {
    console.error("Error from API:", error.message);
    res.status(statusCode.internalServerError).send(apiResponseErr(null, false, statusCode.internalServerError, error.message));
  }
};

export const runnerExternalProfitLoss = async (req, res) => {
  try {
    const { marketId, userName } = req.params;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const searchRunnerName = req.query.search || '';

    const profitLossEntries = await ProfitLoss.findAll({
      where: {
        userName: userName,
        marketId: marketId,
      }
    });

    if (profitLossEntries.length === 0) {
      return res
        .status(statusCode.success)
        .send(apiResponseSuccess([], true, statusCode.success, 'No profit/loss data found for the given date range.'));
    }

    const runnersProfitLoss = await Promise.all(profitLossEntries.map(async entry => {
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
              }
            ]
          }
        ]
      });

      if (!game) return null

      const market = game.Markets[0];
      const runner = market.Runners.find(runner => runner.runnerId === entry.runnerId);

      if (!runner) {
        return apiResponseErr(null, false, statusCode.badRequest, `Runner data not found for runnerId: ${entry.runnerId}`);
      }

      return {
        gameName: game.gameName,
        marketName: market.marketName,
        runnerName: runner.runnerName,
        runnerId: entry.runnerId,
        profitLoss: parseFloat(entry.profitLoss).toFixed(2)
      };
    }));

    const filteredRunnersProfitLoss = runnersProfitLoss.filter(item => item !== null);

    if (filteredRunnersProfitLoss.length === 0) {
      return res
        .status(statusCode.success)
        .send(apiResponseSuccess([], true, statusCode.success, 'No matching runners found.'));
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedRunnersProfitLoss = filteredRunnersProfitLoss.slice(startIndex, endIndex);
    const totalItems = filteredRunnersProfitLoss.length;
    const totalPages = Math.ceil(totalItems / limit);

    const paginationData = {
      page: page,
      totalPages: totalPages,
      totalItems: totalItems
    };

    return res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          paginatedRunnersProfitLoss,
          true,
          statusCode.success,
          'Success',
          paginationData,
        ),
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
          error.message,
        ),
      );
  }
};