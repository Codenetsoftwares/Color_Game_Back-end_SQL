import { UserController } from '../controller/user.controller.js';
import { apiResponseErr, apiResponseSuccess } from '../middleware/serverError.js';
import { database } from '../controller/database.controller.js'
import dotenv from 'dotenv';
dotenv.config();
import { error } from 'console';

export const UserRoute = (app) => {
  app.get('/api/user-games', async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
      const searchQuery = req.query.search || '';

      const getGamesQuery = `
        SELECT G.id, G.gameName, G.Description , G.gameId
        FROM Game G
        WHERE EXISTS (
          SELECT 1
          FROM Admin A
          WHERE JSON_UNQUOTE(JSON_EXTRACT(A.roles, '$[0]')) = 'Admin'
        )
        AND G.gameName LIKE ?
      `;

      const games = await database.execute(getGamesQuery, [`%${searchQuery}%`]);

      const totalItems = games.length;

      let paginatedGames;
      let totalPages = 1;

      if (page && pageSize) {
        totalPages = Math.ceil(totalItems / pageSize);
        paginatedGames = games.slice((page - 1) * pageSize, page * pageSize);
      } else {
        paginatedGames = games;
      }
      const paginated = apiResponsePagination(page, totalPages, totalItems)
      res.status(200).send(apiResponseSuccess(paginatedGames, true, 200, 'success', paginated));

    } catch (error) {
      res
        .status(500)
        .send(apiResponseErr(error.data ?? null, false, error.successCode ?? 500, error.errMessage ?? error.message));
    }
  });

  app.get('/api/user-markets/:gameId', async (req, res) => {
    try {
      const gameId = req.params.gameId;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const searchQuery = req.query.search || '';

      const getMarketsQuery = `
            SELECT M.marketName, M.participants, M.timeSpan, M.status , M.marketId
            FROM Game G
            JOIN Market M ON G.gameId = M.gameId
            WHERE G.gameId = ? AND M.marketName LIKE ?
        `;

      const markets = await database.execute(getMarketsQuery, [gameId, `%${searchQuery}%`]);

      const totalItems = markets.length;

      let paginatedMarkets;
      let totalPages = 1;

      if (page && pageSize) {
        totalPages = Math.ceil(totalItems / pageSize);
        paginatedMarkets = markets.slice((page - 1) * pageSize, page * pageSize);
      } else {
        paginatedMarkets = markets;
      }
      const paginated = apiResponsePagination(page, totalPages, totalItems)
      res.status(200).send(apiResponseSuccess(paginatedMarkets, true, 200, 'success', paginated));
    } catch (error) {
      res
        .status(500)
        .send(apiResponseErr(error.data ?? null, false, error.successCode ?? 500, error.errMessage ?? error.message));
    }
  });

  app.get('/api/user-runners/:gameId/:marketId', async (req, res, next) => {
    try {
      const gameId = req.params.gameId;
      const marketId = req.params.marketId;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const searchQuery = req.query.search || '';

      const getRunnersQuery = `
        SELECT R.runnerName, R.rateBack, R.rateLay , R.runnerId 
        FROM Runner R
        JOIN Market M ON R.marketId = M.marketId
        WHERE M.marketId = ? AND R.runnerName LIKE ?
      `;

      const runners = await database.execute(getRunnersQuery, [marketId, `%${searchQuery}%`]);

      const totalItems = runners.length;

      let paginatedRunners;

      let totalPages = 1;

      if (page && pageSize) {
        totalPages = Math.ceil(totalItems / pageSize);
        paginatedRunners = runners.slice((page - 1) * pageSize, page * pageSize);
      } else {
        paginatedRunners = runners;
      }

      const runnersList = paginatedRunners.map((runner) => ({
        runnerName: runner.runnerName,
        rateBack: runner.rateBack,
        rateLay: runner.rateLay,
        runnerId: runner.runnerId,
      }));
      const paginated = apiResponsePagination(page, totalPages, totalItems)
      res.status(200).send(apiResponseSuccess(runnersList, true, 200, 'success', paginated));
      // res.status(200).send({
      //   runners: runnersList,
      //   currentPage: page,
      //   totalPages: totalPages,
      //   totalItems: totalItems,
      //   gameId: gameId,
      //   marketId: marketId,
      // });
    } catch (error) {
      res
        .status(500)
        .send(apiResponseErr(error.data ?? null, false, error.successCode ?? 500, error.errMessage ?? error.message));
    }
  });


  app.post('/api/eligibilityCheck/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { eligibilityCheck } = req.body;
      const check = await UserController.eligibilityCheck(userId, eligibilityCheck);
      res.status(200).send(apiResponseSuccess(check, true, 200, 'success'));
    } catch (error) {
      res
        .status(500)
        .send(apiResponseErr(error.data ?? null, false, error.successCode ?? 500, error.errMessage ?? error.message));
    }
  });

  app.get('/api/User-Details', async (req, res) => {
    try {
      const getUsersQuery = 'SELECT * FROM user';
      const users = await database.execute(getUsersQuery);

      if (!users || users.length === 0) {
        throw { code: 404, message: 'User not found' };
      }
      res.status(200).send(apiResponseSuccess(users, true, 200, 'success'));
    } catch (error) {
      res
        .status(500)
        .send(apiResponseErr(error.data ?? null, false, error.successCode ?? 500, error.errMessage ?? error.message));
    }
  });

  app.get('/api/user-All-gameData', async (req, res) => {
    try {
      const gameData = await UserController.getGameData();
      if (!gameData || gameData.length === 0) {
        return res.status(404).json({ message: 'Games not found' });
      }
      const formattedGameData = UserController.formatGameData(gameData);
      res.status(200).send(apiResponseSuccess(formattedGameData, true, 200, 'success'));
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' }); res
        .status(500)
        .send(apiResponseErr(error.data ?? null, false, error.successCode ?? 500, error.errMessage ?? error.message));
    }
  });

  app.get('/api/user/announcements/:typeOfAnnouncement', async (req, res) => {
    try {
      const { typeOfAnnouncement } = req.params;
      const latestAnnouncement = await UserController.getAnnouncementUser(typeOfAnnouncement);
      res.status(200).send(apiResponseSuccess(latestAnnouncement, true, 200, 'Success'));
    } catch (error) {
      res
        .status(500)
        .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
    }
  });

  app.get('/api/user/announcement-Type', async (req, res) => {
    try {
      const announce = await UserController.getAnnouncementTypes();
      res.status(200).send(apiResponseSuccess(announce, true, 200, 'Success'));
    } catch (error) {
      res
        .status(500)
        .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
    }
  });

  
};
