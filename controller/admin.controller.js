import { database } from '../controller/database.controller.js'
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { apiResponseErr, apiResponseSuccess, apiResponsePagination } from '../middleware/serverError.js';

dotenv.config();
// done
export const createAdmin = async (req, res) => {
  const { userName, password, roles } = req.body;
  try {
    const existingAdminQuery = 'SELECT * FROM Admin WHERE userName = ?';
    const [existingAdmin] = await database.execute(existingAdminQuery, [userName]);

    if (existingAdmin.length > 0) {
      throw new Error('Admin already exists');
    }

    const saltRounds = 10;
    const encryptedPassword = await bcrypt.hash(password, saltRounds);

    const adminId = uuidv4();

    const insertAdminQuery = 'INSERT INTO Admin (adminId, userName, password, roles) VALUES (?, ?, ?, ?)';
    const [result] = await database.execute(insertAdminQuery, [adminId, userName, encryptedPassword, JSON.stringify(roles)]);

    const newAdmin = {
      id: result.insertId,
      userName,
      password: encryptedPassword,
      roles
    };
    return res.status(201).json(apiResponseSuccess(newAdmin, 201, true, 'Admin created successfully'));

  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// done
export const generateAccessToken = async (req, res) => {
  const { userName, password } = req.body;
  try {
    const existingAdminQuery = 'SELECT * FROM Admin WHERE userName = ?';
    const [existingAdmin] = await database.execute(existingAdminQuery, [userName]);

    if (existingAdmin.length === 0) {
      return apiResponseErr(null, false, 400, 'Admin Does Not Exist');
    }

    const admin = existingAdmin[0];

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return apiResponseErr(null, false, 400, 'Invalid username or password');
    }

    const accessTokenResponse = {
      id: admin.id,
      userName: admin.userName,
      UserType: admin.userType || 'Admin',
    };

    const accessToken = jwt.sign(accessTokenResponse, process.env.JWT_SECRET_KEY, {
      expiresIn: '1d',
    });

    return res.status(200).send(apiResponseSuccess({ accessToken, userName: admin.userName, UserType: admin.userType || 'Admin' },
      true,
      200,
      'Admin login successfully',
    ));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};

export const createUser = async (req, res) => {
  const { firstName, lastName, userName, phoneNumber, password } = req.body;
  try {
      const existingUserQuery = 'SELECT * FROM User WHERE userName = ?';
      const [existingUser] = await database.execute(existingUserQuery, [userName]);

      if (existingUser.length > 0) {
        return res.status(400).send(apiResponseErr(existingUser, false, 400, 'User already exists'));
      }
      
      const passwordSalt = await bcrypt.genSalt();
      const encryptedPassword = await bcrypt.hash(password, passwordSalt);

      const insertUserQuery = `
          INSERT INTO User (firstName, lastName, userName, phoneNumber, password, roles)
          VALUES (?, ?, ?, ?, ?, ?)
      `;
      await database.execute(insertUserQuery, [firstName, lastName, userName, phoneNumber, encryptedPassword, 'User']);

      return res.status(201).send(apiResponseSuccess(existingUser, true, 201, 'User created successfully'));
  } catch (error) {
      res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};

export const checkMarketStatus = async (req, res) => {
  const marketId = req.params.marketId;
  const { status } = req.body;

  try {
    const [market] = await database.execute('SELECT * FROM Market WHERE marketId = ?', [marketId]);

    if (!market) {
      return res.status(404).json(apiResponseErr(null, false, 404, 'Market not found.'));
    }

    const updateMarketQuery = 'UPDATE Market SET isActive = ? WHERE marketId = ?';
    await database.execute(updateMarketQuery, [status, marketId]);

    const statusMessage = status ? 'Market is active.' : 'Market is suspended.';
    res.status(200).send(apiResponseSuccess(statusMessage, true, 200, 'success'));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
    const searchQuery = req.query.search ? req.query.search.toLowerCase() : '';

    const countQuery = `SELECT COUNT(*) AS total FROM User WHERE LOWER(userName) LIKE '%${searchQuery}%'`;
    const [countResult] = await database.execute(countQuery);
    const totalItems = countResult[0].total;

    const totalPages = Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;

    const getUsersQuery = `SELECT * FROM User WHERE LOWER(userName) LIKE '%${searchQuery}%' LIMIT ${offset}, ${pageSize}`;
    const [users] = await database.execute(getUsersQuery);

    if (!users || users.length === 0) {
      throw apiResponseErr(null, false, 400, 'User not found');
    }

    const paginationData = apiResponsePagination(page, totalPages, totalItems);
    return res.status(200).send(apiResponseSuccess(users, true, 200, paginationData));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};


//   createGame: async (gameName, Description) => {
//     try {
//       const adminQuery = "SELECT * FROM Admin WHERE JSON_UNQUOTE(JSON_EXTRACT(roles, '$[0]')) = 'Admin'";

//       const [adminRows] = await database.execute(adminQuery);

//       if (!adminRows) {
//         throw apiResponseErr(null, false, 400, 'Admin Not Found');
//       }

//       const gameId = uuidv4();

//       const insertGameQuery = 'INSERT INTO Game (gameName, Description, gameId) VALUES (?, ?, ?)';
//       const insertGameResult = await database.execute(insertGameQuery, [gameName, Description, gameId]);

//       const selectGameQuery = 'SELECT * FROM Game WHERE id = ?';
//       const selectedGameRows = await database.execute(selectGameQuery, [insertGameResult.insertId]);

//       if (!selectedGameRows || selectedGameRows.length === 0) {
//         console.error('Game Not Found');
//         throw apiResponseErr(null, false, 400, 'Game Not Found');
//       }

//       const selectedGame = selectedGameRows[0];

//       if (!selectedGame || typeof selectedGame !== 'object') {
//         console.error('Invalid game data');
//         throw apiResponseErr(null, false, 400, 'Invalid game data');
//       }

//       return {
//         gameList: [
//           {
//             id: selectedGame.id || null,
//             gameId: selectedGame.gameId || null,
//             gameName: selectedGame.gameName || '',
//             Description: selectedGame.Description || '',
//             markets: [],
//           },
//         ],
//       };
//     } catch (error) {
//       console.error(error);
//       throw error;
//     }
//   },

//   createMarket: async (gameId, marketName, participants, timeSpan) => {
//     try {
//       // console.log("Admin ID:", adminId);
//       console.log('Game ID:', gameId);
//       const marketId = uuidv4();

//       const insertMarketQuery = `
//         INSERT INTO Market (marketId, gameId, marketName, participants, timeSpan)
//         VALUES (?, ?, ?, ?, ?)
//       `;

//       const insertMarketResult = await database.execute(insertMarketQuery, [
//         marketId,
//         gameId,
//         marketName,
//         participants,
//         timeSpan,
//       ]);

//       const selectMarketQuery = 'SELECT * FROM Market WHERE marketId = ?';
//       const selectedMarketRows = await database.execute(selectMarketQuery, [marketId]);

//       if (!selectedMarketRows || selectedMarketRows.length === 0) {
//         console.error('Market not found');
//         throw apiResponseErr(null, false, 400, 'Market Not Found');
//       }

//       const selectedMarket = selectedMarketRows[0];

//       if (!selectedMarket || typeof selectedMarket !== 'object') {
//         throw apiResponseErr(null, false, 400, 'Invalid market data');
//       }

//       return {
//         marketList: [
//           {
//             id: selectedMarket.id || null,
//             gameId: selectedMarket.gameId || null,
//             marketId: selectedMarket.marketId || null,
//             marketName: selectedMarket.marketName || '',
//             participants: selectedMarket.participants || '',
//             timeSpan: selectedMarket.timeSpan || '',
//             runners: [],
//           },
//         ],
//       };
//     } catch (error) {
//       console.error(error);
//       throw error;
//     }
//   },

//   createRunner: async (gameId, marketId, runnerNames) => {
//     try {
//       const getMarketQuery = `
//       SELECT id, participants
// FROM market
// WHERE marketId = ? AND gameId = ?

//   `;

//       console.log('Game ID:', gameId);
//       console.log('Market ID:', marketId);

//       const [market] = await database.execute(getMarketQuery, [marketId, gameId]);

//       console.log('Market found:', market);

//       if (!market) {
//         console.error('Market not found for gameId:', gameId, 'and marketId:', marketId);
//         throw { message: 'Market not found' };
//       }

//       console.log('Market found:', market);

//       const maxParticipants = market.participants;

//       if (runnerNames.length !== maxParticipants) {
//         throw apiResponseErr(null, false, 400, 'Number of runners exceeds the maximum allowed participants.');
//       }

//       const newRunners = runnerNames.map((runnerName) => {
//         const runnerId = uuidv4();
//         const name = runnerName;
//         return {
//           runnerId: runnerId,
//           runnerName: runnerName,
//           gameId: gameId,
//           marketId: marketId,
//         };
//       });

//       const insertRunnersQuery = `
//             INSERT INTO Runner (runnerId, runnerName, gameId, marketId)
//             VALUES ?
//         `;

//       await database.execute(insertRunnersQuery, [
//         newRunners.map((runner) => [runner.runnerId, runner.runnerName, runner.gameId, runner.marketId]),
//       ]);

//       return { success: true };
//     } catch (error) {
//       throw error;
//     }
//   },

//   createRate: async (gameId, marketId, runnerId, back, lay) => {
//     try {
//       const checkRateQuery = `
//         SELECT id
//         FROM Rate
//         WHERE runnerId = ? AND gameId = ? AND marketId = ?
//       `;
//       const existingRate = await database.execute(checkRateQuery, [runnerId, gameId, marketId]);

//       if (existingRate && existingRate.length > 0) {
//         const updateRateQuery = `
//           UPDATE Rate
//           SET Back = ?, Lay = ?
//           WHERE runnerId = ? AND gameId = ? AND marketId = ?
//         `;
//         await database.execute(updateRateQuery, [back, lay, runnerId, gameId, marketId]);
//       } else {
//         const insertRateQuery = `
//           INSERT INTO Rate (runnerId, Back, Lay, marketId, gameId)
//           SELECT ?, ?, ?, ?, ?
//           WHERE NOT EXISTS (
//             SELECT 1
//             FROM Rate
//             WHERE marketId = ? AND gameId = ?
//           )
//         `;
//         await database.execute(insertRateQuery, [runnerId, back, lay, marketId, gameId, marketId, gameId]);
//       }

//       const updateRunnerQuery = `
//         UPDATE Runner
//         SET rateBack = ?, rateLay = ?
//         WHERE runnerId = ? AND gameId = ? AND marketId = ?
//       `;
//       await database.execute(updateRunnerQuery, [back, lay, runnerId, gameId, marketId]);

//       return { success: true };
//     } catch (error) {
//       console.error(error);
//       throw error;
//     }
//   },

//   checkMarketStatus: async (marketId, status) => {
//     try {
//       const formattedStatus = status ? 1 : 0;

//       const updateMarketQuery = `
//       UPDATE Market
//       SET status = ?
//       WHERE marketId = ?
//     `;

//       const updateResult = await database.execute(updateMarketQuery, [formattedStatus, marketId]);

//       if (updateResult.affectedRows === 0) {
//         throw new Error('Market not found.');
//       }

//       const statusMessage = status ? 'Market is active.' : 'Market is suspended.';

//       return { currentStatus: statusMessage };
//     } catch (error) {
//       throw error;
//     }
//   },

//   updateGame: async (adminId, gameId, gameName, description) => {
//     const updateGameQuery = `
//   UPDATE game
//   SET gameName = COALESCE(?, gameName),
//       description = COALESCE(?, description)
//   WHERE gameId = ? AND adminId = ?;
// `;

//     const updateGameValues = [gameName, description, gameId, adminId];

//     await database.execute(updateGameQuery, updateGameValues);
//   },

//   updateMarket: async (adminId, gameId, marketId, marketName, participants, timeSpan) => {
//     const updateMarketQuery = `
//       UPDATE market
//       SET marketName = COALESCE(?, marketName),
//           participants = COALESCE(?, participants),
//           timeSpan = COALESCE(?, timeSpan)
//       WHERE marketId = ? AND gameId = ? AND adminId = ?;
//     `;

//     const updateMarketValues = [marketName, participants, timeSpan, marketId, gameId, adminId];

//     await database.execute(updateMarketQuery, updateMarketValues);
//   },

//   updateRunner: async (adminId, gameId, marketId, runnerId, runnerName) => {
//     const updateRunnerQuery = `
//       UPDATE runner
//       SET runnerName = COALESCE(?, runnerName)
//       WHERE runnerId = ? AND marketId = (
//         SELECT marketId FROM Market WHERE marketId = ? AND gameId = ? AND adminId = ?
//       );
//     `;

//     const updateRunnerValues = [runnerName, runnerId, marketId, gameId, adminId];

//     await database.execute(updateRunnerQuery, updateRunnerValues);
//   },

//   updateRate: async (adminId, gameId, marketId, runnerId, back, lay) => {
//     const updateRateQuery = `
//       UPDATE rate
//       SET Back = COALESCE(?, Back),
//           Lay = COALESCE(?, Lay)
//       WHERE runnerId = ? AND marketId = (
//         SELECT marketId FROM Market WHERE marketId = ? AND gameId = ? AND adminId = ?
//       );
//     `;

//     const updateRateValues = [back, lay, runnerId, marketId, gameId, adminId];

//     await database.execute(updateRateQuery, updateRateValues);
//   },

//   CreateSlider: async (sliderCount, data, user) => {
//     try {
//       if (!Array.isArray(data)) {
//         throw { code: 400, message: 'Data must be an array' };
//       }

//       let documentArray = [];

//       for (const element of data) {
//         let obj = {};
//         const result = await awsS3Obj.addDocumentToS3(element.docBase, element.name, 'game-slider', element.doctype);
//         console.log('Result from awsS3Obj.addDocumentToS3:', result);
//         obj.image = result.Location;
//         obj.text = element.text;
//         obj.headingText = element.headingText;
//         documentArray.push(obj);
//       }

//       const newSlider = {
//         sliderCount: sliderCount,
//         document: JSON.stringify(documentArray),
//       };

//       const createSliderQuery = 'INSERT INTO Slider SET ?';
//       const savedSlider = await database.execute(createSliderQuery, [newSlider]);
//       console.log('Saved slider:', savedSlider);

//       return true;
//     } catch (error) {
//       throw error;
//     }
//   },

//   announcements: async (typeOfAnnouncement, announcement, user) => {
//     try {
//       if (!typeOfAnnouncement || !announcement) {
//         throw apiResponseErr(null, false, 400, 'announcement type and announcement are required');
//       }

//       let announcementId;

//       const existingAnnouncementQuery = `
//             SELECT announceId
//             FROM Announcement
//             WHERE typeOfAnnouncement = ?
//             ORDER BY id DESC
//             LIMIT 1
//         `;
//       const [existingAnnouncement] = await database.execute(existingAnnouncementQuery, [typeOfAnnouncement]);

//       if (existingAnnouncement) {
//         announcementId = existingAnnouncement.announceId;
//       } else {
//         announcementId = uuidv4();
//       }

//       const insertAnnouncementQuery = `
//             INSERT INTO Announcement (announceId, typeOfAnnouncement, announcement, createdBy)
//             VALUES (?, ?, ?, ?)
//         `;
//       await database.execute(insertAnnouncementQuery, [announcementId, typeOfAnnouncement, announcement, user._id]);

//       return;
//     } catch (error) {
//       throw error;
//     }
//   },

//   getAnnouncement: async (announceId) => {
//     try {
//       const getAnnouncementQuery = `
//           SELECT announceId, typeOfAnnouncement, announcement
//           FROM Announcement
//           WHERE announceId = ?
//       `;
//       const [announcement] = await database.execute(getAnnouncementQuery, [announceId]);

//       if (!announcement) {
//         throw apiResponseErr(null, false, 400, 'Announcement not found');
//       }

//       const getLatestAnnouncementQuery = `
//           SELECT announceId, typeOfAnnouncement, announcement
//           FROM Announcement
//           WHERE typeOfAnnouncement = ?
//           ORDER BY id DESC
//           LIMIT 1
//       `;
//       const [latestAnnouncement] = await database.execute(getLatestAnnouncementQuery, [announcement.typeOfAnnouncement]);

//       if (!latestAnnouncement) {
//         throw apiResponseErr(null, false, 400, 'Latest announcement not found');
//       }

//       return {
//         announcementId: latestAnnouncement.announceId,
//         typeOfAnnouncement: latestAnnouncement.typeOfAnnouncement,
//         announcement: [latestAnnouncement.announcement],
//       };
//     } catch (error) {
//       throw error;
//     }
//   },

//   updateAnnouncement: async (typeOfAnnouncement, announcement, announceId) => {
//     try {
//       const updateAnnouncementQuery = `
//           UPDATE Announcement
//           SET
//               typeOfAnnouncement = COALESCE(?, typeOfAnnouncement),
//               announcement = COALESCE(?, announcement)
//           WHERE announceId = ?
//       `;
//       const updateAnnouncementValues = [typeOfAnnouncement, announcement, announceId];

//       await database.execute(updateAnnouncementQuery, updateAnnouncementValues);

//       const getUpdatedAnnouncementQuery = `
//           SELECT *
//           FROM Announcement
//           WHERE announceId = ?
//       `;
//       const [updatedAnnouncement] = await database.execute(getUpdatedAnnouncementQuery, [announceId]);

//       if (!updatedAnnouncement) {
//         throw apiResponseErr(null, false, 400, 'Announcement not found');
//       }

//       return updatedAnnouncement;
//     } catch (error) {
//       throw error;
//     }
//   },

