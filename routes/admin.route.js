import { Authorize } from '../middleware/auth.js';
import dotenv from 'dotenv';
import customErrorHandler from '../middleware/customErrorHandler.js';
import { checkMarketStatus, createAdmin, createUser, generateAccessToken, getAllUsers } from '../controller/admin.controller.js';
import { createdUserSchema, loginSchema, suspendedMarketSchema } from '../schema/commonSchema.js';

dotenv.config();

export const AdminRoute = (app) => {
  app.post('/api/admin-create', customErrorHandler, createAdmin);

  app.post('/api/admin-login', loginSchema, customErrorHandler, generateAccessToken);

  app.post('/api/user-create', createdUserSchema, customErrorHandler, Authorize(["Admin"]), createUser);

  app.post('/api/update-market-status/:marketId', suspendedMarketSchema, customErrorHandler, checkMarketStatus);

  app.get('/api/All-User', customErrorHandler, getAllUsers);


//   app.post('/api/user-login', errorHandler, async (req, res, next) => {
//     try {
//       const { userName, password, persist } = req.body;

//       const tokenData = await AdminController.loginUser(userName, password, persist);
//       res.status(200).send(apiResponseSuccess(tokenData, true, 200, 'Login successfully'));
//     } catch (error) {
//       res
//         .status(500)
//         .send(apiResponseErr(error.data ?? null, false, error.successCode ?? 500, error.errMessage ?? error.message));
//     }
//   });

//   app.post('/api/create-games', Authorize(['Admin']), errorHandler, async (req, res, next) => {
//     try {
//       const { gameName, Description } = req.body;
//       const result = await AdminController.createGame(gameName, Description);
//       const games = result.gameList;
//       res.status(201).send(apiResponseSuccess(games, true, 201, 'Game Create Successfully'));
//     } catch (error) {
//       res
//         .status(500)
//         .send(apiResponseErr(error.data ?? null, false, error.successCode ?? 500, error.errMessage ?? error.message));
//     }
//   });

//   app.post('/api/create-markets/:gameId', Authorize(['Admin']), errorHandler, async (req, res, next) => {
//     try {
//       const { gameId } = req.params;
//       const { marketName, participants, timeSpan } = req.body;
//       const markets = await AdminController.createMarket(gameId, marketName, participants, timeSpan);
//       res.status(201).send(apiResponseSuccess(markets, true, 201, 'Market created successfully'));
//     } catch (error) {
//       res
//         .status(500)
//         .send(apiResponseErr(error.data ?? null, false, error.successCode ?? 500, error.errMessage ?? error.message));
//     }
//   });

//   app.post('/api/create-runners/:gameId/:marketId', Authorize(['Admin']), errorHandler, async (req, res, next) => {
//     try {
//       console.log('User:', req.user);
//       const { gameId, marketId } = req.params;
//       const { runnerNames } = req.body;
//       const runners = await AdminController.createRunner(gameId, marketId, runnerNames);
//       res.status(201).send(apiResponseSuccess(runners, true, 201, 'Runner Create Successfully'));
//     } catch (error) {
//       res
//         .status(500)
//         .send(apiResponseErr(error.data ?? null, false, error.successCode ?? 500, error.errMessage ?? error.message));
//     }
//   });

//   app.post(
//     '/api/create-rate/:gameId/:marketId/:runnerId',
//     Authorize(['Admin']),
//     errorHandler,
//     async (req, res, next) => {
//       try {
//         const { gameId, marketId, runnerId } = req.params;
//         const { back, lay } = req.body;

//         const rates = await AdminController.createRate(gameId, marketId, runnerId, back, lay);
//         res.status(201).send(apiResponseSuccess(rates, true, 201, 'Rate created successfully'));
//       } catch (error) {
//         res
//           .status(500)
//           .send(apiResponseErr(error.data ?? null, false, error.successCode ?? 500, error.errMessage ?? error.message));
//       }
//     },
//   );

//   app.get('/api/All-Games', Authorize(['Admin']), errorHandler, async (req, res, next) => {
//     try {
//       const page = req.query.page ? parseInt(req.query.page) : 1;
//       const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
//       const searchQuery = req.query.search || '';

//       const getGamesQuery = `
//         SELECT G.id, G.gameName, G.Description , G.gameId
//         FROM Game G
//         WHERE EXISTS (
//           SELECT 1
//           FROM Admin A
//           WHERE JSON_UNQUOTE(JSON_EXTRACT(A.roles, '$[0]')) = 'Admin'
//         )
//         AND G.gameName LIKE ?
//       `;

//       const games = await database.execute(getGamesQuery, [`%${searchQuery}%`]);

//       const totalItems = games.length;

//       let paginatedGames;
//       let totalPages = 1;

//       if (page && pageSize) {
//         totalPages = Math.ceil(totalItems / pageSize);
//         paginatedGames = games.slice((page - 1) * pageSize, page * pageSize);
//       } else {
//         paginatedGames = games;
//       }
//       const paginated = apiResponsePagination(page, totalPages, totalItems)
//       res.status(200).send(apiResponseSuccess(paginatedGames, true, 200, 'success' ,paginated));

//     } catch (error) {
//       res
//         .status(500)
//         .send(apiResponseErr(error.data ?? null, false, error.successCode ?? 500, error.errMessage ?? error.message));
//     }
//   });

//   app.get('/api/All-Markets/:gameId', Authorize(['Admin']), errorHandler, async (req, res, next) => {
//     try {
//       const gameId = req.params.gameId;
//       const page = parseInt(req.query.page) || 1;
//       const pageSize = parseInt(req.query.pageSize) || 10;
//       const searchQuery = req.query.search || '';

//       const getMarketsQuery = `
//             SELECT M.marketName, M.participants, M.timeSpan, M.status , M.marketId
//             FROM Game G
//             JOIN Market M ON G.gameId = M.gameId
//             WHERE G.gameId = ? AND M.marketName LIKE ?
//         `;

//       const markets = await database.execute(getMarketsQuery, [gameId, `%${searchQuery}%`]);

//       const totalItems = markets.length;

//       let paginatedMarkets;
//       let totalPages = 1;

//       if (page && pageSize) {
//         totalPages = Math.ceil(totalItems / pageSize);
//         paginatedMarkets = markets.slice((page - 1) * pageSize, page * pageSize);
//       } else {
//         paginatedMarkets = markets;
//       }
//       const paginated = apiResponsePagination(page, totalPages, totalItems)
//       res.status(200).send(apiResponseSuccess(paginatedMarkets, true, 200, 'success' ,paginated));
//     } catch (error) {
//       res
//         .status(500)
//         .send(apiResponseErr(error.data ?? null, false, error.successCode ?? 500, error.errMessage ?? error.message));
//     }
//   });

//   app.get('/api/All-Runners/:gameId/:marketId', Authorize(['Admin']), errorHandler, async (req, res, next) => {
//     try {
//       const gameId = req.params.gameId;
//       const marketId = req.params.marketId;
//       const page = parseInt(req.query.page) || 1;
//       const pageSize = parseInt(req.query.pageSize) || 10;
//       const searchQuery = req.query.search || '';

//       const getRunnersQuery = `
//         SELECT R.runnerName, R.rateBack, R.rateLay , R.runnerId 
//         FROM Runner R
//         JOIN Market M ON R.marketId = M.marketId
//         WHERE M.marketId = ? AND R.runnerName LIKE ?
//       `;

//       const runners = await database.execute(getRunnersQuery, [marketId, `%${searchQuery}%`]);

//       const totalItems = runners.length;

//       let paginatedRunners;

//       let totalPages = 1;

//       if (page && pageSize) {
//         totalPages = Math.ceil(totalItems / pageSize);
//         paginatedRunners = runners.slice((page - 1) * pageSize, page * pageSize);
//       } else {
//         paginatedRunners = runners;
//       }

//       const runnersList = paginatedRunners.map((runner) => ({
//         runnerName: runner.runnerName,
//         rateBack: runner.rateBack,
//         rateLay: runner.rateLay,
//         runnerId: runner.runnerId,
//       }));
//       const paginated = apiResponsePagination(page, totalPages, totalItems)
//       res.status(200).send(apiResponseSuccess(runnersList, true, 200, 'success' ,paginated));
//       // res.status(200).send({
//       //   runners: runnersList,
//       //   currentPage: page,
//       //   totalPages: totalPages,
//       //   totalItems: totalItems,
//       //   gameId: gameId,
//       //   marketId: marketId,
//       // });
//     } catch (error) {
//       res
//         .status(500)
//         .send(apiResponseErr(error.data ?? null, false, error.successCode ?? 500, error.errMessage ?? error.message));
//     }
//   });

//   app.post('/api/update-market-status/:marketId', Authorize(['Admin']), errorHandler, async (req, res, next) => {
//     try {
//       const { marketId } = req.params;
//       const { status } = req.body;

//       const result = await AdminController.checkMarketStatus(marketId, status);
//       res.status(201).send(apiResponseSuccess(result, true, 201, 'success'));
//     } catch (error) {
//       if (error.message === 'Market not found.' || error.message === 'Invalid status format. It should be a boolean.') {
//         res
//           .status(500)
//           .send(apiResponseErr(error.data ?? null, false, error.successCode ?? 500, error.errMessage ?? error.message));
//       }
//       res
//         .status(500)
//         .send(apiResponseErr(error.data ?? null, false, error.successCode ?? 500, error.errMessage ?? error.message));
//     }
//   });

//   app.put('/api/update', Authorize(['Admin']), errorHandler, async (req, res, next) => {
//     try {
//       const { gameId, marketId, runnerId } = req.query;
//       const { gameName, description, marketName, participants, timeSpan, RunnerName, back, lay } = req.body;

//       const admin = await database.execute("SELECT * FROM Admin WHERE roles = 'Admin' LIMIT 1");

//       if (!admin || admin.length === 0) {
//         throw { code: 404, message: 'Admin not found' };
//       }

//       if (gameId) {
//         await AdminController.updateGame(admin[0].adminId, gameId, gameName, description);
//       }

//       if (marketId) {
//         await AdminController.updateMarket(admin[0].adminId, gameId, marketId, marketName, participants, timeSpan);
//       }

//       if (runnerId) {
//         await AdminController.updateRunner(admin[0].adminId, gameId, marketId, runnerId, RunnerName);
//         await AdminController.updateRate(admin[0].adminId, gameId, marketId, runnerId, back, lay);
//       }
//       res.status(201).send(apiResponseSuccess(admin[0].gameList, true, 201, 'Edit successful'));
//     } catch (error) {
//       res
//         .status(500)
//         .send(apiResponseErr(error.data ?? null, false, error.successCode ?? 500, error.errMessage ?? error.message));
//     }
//   });

//   app.post('/api/admin/slider-text-img/dynamic', Authorize(['Admin']), errorHandler, async (req, res, next) => {
//     try {
//       const { sliderCount, data } = req.body;
//       const createSlider = await AdminController.CreateSlider(sliderCount, data, req.user);
//       if (createSlider) {
//         res.status(201).send(apiResponseSuccess(createSlider, true, 201, 'Slider and text Created Successful'));
//       }
//     } catch (error) {
//       res
//         .status(500)
//         .send(apiResponseErr(error.data ?? null, false, error.successCode ?? 500, error.errMessage ?? error.message));
//     }
//   });

//   app.get('/api/All-User', errorHandler, async (req, res, next) => {
//     try {
//       const getUsersQuery = 'SELECT * FROM user';
//       const users = await database.execute(getUsersQuery);

//       if (!users || users.length === 0) {
//         res.status(400).send(apiResponseErr(users, true, 400, 'User not found'));
//       }
//       res.status(200).send(apiResponseErr(users, true, 200, 'success'));
//     } catch (error) {
//       res
//         .status(500)
//         .send(apiResponseErr(error.data ?? null, false, error.successCode ?? 500, error.errMessage ?? error.message));
//     }
//   });

//   app.post('/api/admin/announcements', Authorize(['Admin']), async (req, res) => {
//     try {
//       const { typeOfAnnouncement, announcement } = req.body;
//       const user = req.user;
//       const announce = await AdminController.announcements(typeOfAnnouncement, announcement, user);
//       res.status(201).send(apiResponseSuccess(announce, true, 201, 'Announcement Create successfully'));
//     } catch (error) {
//       res
//         .status(500)
//         .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
//     }
//   });

//   app.get('/api/admin/announcements-latest/:announceId', async (req, res) => {
//     try {
//       const announceId = req.params.announceId;
//       const latestAnnouncement = await AdminController.getAnnouncement(announceId);
//       res.status(200).send(apiResponseSuccess(latestAnnouncement, true, 200, 'success'));
//     } catch (error) {
//       res

//         .status(500)
//         .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
//     }
//   });

//   app.put('/api/admin/update-announcement/:announceId', async (req, res) => {
//     try {
//       const announceId = req.params.announceId;
//       const { typeOfAnnouncement, announcement } = req.body;
//       const updateAnnouncement = await AdminController.updateAnnouncement(typeOfAnnouncement, announcement, announceId);
//       res.status(200).send(apiResponseSuccess(updateAnnouncement, true, 200, 'success'));
//     } catch (error) {
//       res
//         .status(500)
//         .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
//     }
//   });
};
