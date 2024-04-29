import { database } from '../controller/database.controller.js'
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import awsS3Obj from '../helper/awsS3.js';
import { apiResponseErr, apiResponseSuccess, apiResponsePagination } from '../middleware/serverError.js';

dotenv.config();

export const AdminController = {
  createAdmin: async (data) => {
    try {
      if (!data.userName || !data.password || !data.roles || data.roles.length === 0) {
        throw apiResponseErr(null, false, 409, 'Invalid input data');
      }

      const existingAdminQuery = 'SELECT * FROM Admin WHERE userName = ?';
      console.log('Existing Admin Query:', existingAdminQuery);

      const [existingAdmin] = await database.execute(existingAdminQuery, [data.userName]);
      console.log("existingAdmin", existingAdmin)
      if (existingAdmin.length > 0) {
        throw apiResponseErr(null, false, 409, 'Admin Already Exists');
      }

      const encryptedPassword = await bcrypt.hash(data.password, 10);

      const adminId = uuidv4();

      const insertAdminQuery = `
            INSERT INTO Admin (adminId, userName, password, roles)
            VALUES (?, ?, ?, ?)
        `;

      await database.execute(insertAdminQuery, [adminId, data.userName, encryptedPassword, JSON.stringify(data.roles)]);
    } catch (error) {
      throw error;
    }
  },


  GenerateAdminAccessToken: async (userName, password, persist) => {
    try {
      if (!userName) {
        throw apiResponseErr(null, false, 400, 'Invalid userName');
      }
      if (!password) {
        throw apiResponseErr(null, false, 400, 'Invalid password');
      }

      const getUserQuery = 'SELECT * FROM Admin WHERE userName = ?';
      const [existingUser] = await database.execute(getUserQuery, [userName]);

      if (!existingUser) {
        throw apiResponseErr(null, false, 400, 'Invalid userName or Password');
      }

      const passwordValid = await bcrypt.compare(password, existingUser.password);
      if (!passwordValid) {
        throw apiResponseErr(null, false, 400, 'Invalid userName or Password');
      }

      const accessTokenPayload = {
        id: existingUser.id,
        userName: existingUser.userName,
        UserType: existingUser.userType || 'Admin',
      };

      const accessToken = jwt.sign(accessTokenPayload, process.env.JWT_SECRET_KEY, {
        expiresIn: persist ? '1y' : '8h',
      });

      const response = {
        userName: existingUser.userName,
        accessToken: accessToken,
        roles: existingUser.roles,
        UserType: existingUser.userType || 'Admin',
      };

      return response;
    } catch (err) {
      throw err;
    }
  },

  createUser: async (data) => {
    try {
      if (!data.firstName || !data.lastName || !data.userName || !data.phoneNumber || !data.password) {
        throw apiResponseErr(null, false, 409, 'Invalid input data');
      }

      const existingUserQuery = 'SELECT * FROM User WHERE userName = ?';
      const [existingUsers] = await database.execute(existingUserQuery, [data.userName]);

      console.log('Existing User:', existingUsers);

      if (existingUsers.length > 0) {
        throw apiResponseErr(null, false, 409, 'User Already Exists');
      }

      const encryptedPassword = await bcrypt.hash(data.password, 10);

      const insertUserQuery = `
        INSERT INTO User (firstName, lastName, userName, phoneNumber, password)
        VALUES (?, ?, ?, ?, ?)
      `;

      await database.execute(insertUserQuery, [
        data.firstName,
        data.lastName,
        data.userName,
        data.phoneNumber,
        encryptedPassword,
      ]);
    } catch (error) {
      throw error;
    }
  },

  loginUser: async (userName, password, persist) => {
    try {
      if (!userName) {
        throw apiResponseErr(null, false, 400, 'Invalid value for');
      }
      if (!password) {
        throw apiResponseErr(null, false, 400, 'Invalid value for');
      }

      const getUserQuery = 'SELECT * FROM User WHERE userName = ?';
      const [existingUser] = await database.execute(getUserQuery, [userName]);

      if (!existingUser) {
        throw apiResponseErr(null, false, 400, 'Invalid User Name or password');
      }

      const passwordValid = await bcrypt.compare(password, existingUser.password);
      if (!passwordValid) {
        throw apiResponseErr(null, false, 400, 'Invalid User Name or password');
      }

      const accessTokenPayload = {
        id: existingUser.id,

        userName: existingUser.userName,
      };

      const accessToken = jwt.sign(accessTokenPayload, process.env.JWT_SECRET_KEY, {
        expiresIn: persist ? '1y' : '8h',
      });

      const response = {
        userName: existingUser.userName,
        accessToken: accessToken,
        roles: accessTokenPayload.roles,
      };

      return response;
    } catch (err) {
      throw err;
    }
  },

  createGame: async (gameName, Description) => {
    try {
      const adminQuery = "SELECT * FROM Admin WHERE JSON_UNQUOTE(JSON_EXTRACT(roles, '$[0]')) = 'Admin'";

      const [adminRows] = await database.execute(adminQuery);

      if (!adminRows) {
        throw apiResponseErr(null, false, 400, 'Admin Not Found');
      }

      const gameId = uuidv4();

      const insertGameQuery = 'INSERT INTO Game (gameName, Description, gameId) VALUES (?, ?, ?)';
      const insertGameResult = await database.execute(insertGameQuery, [gameName, Description, gameId]);

      const selectGameQuery = 'SELECT * FROM Game WHERE id = ?';
      const selectedGameRows = await database.execute(selectGameQuery, [insertGameResult.insertId]);

      if (!selectedGameRows || selectedGameRows.length === 0) {
        console.error('Game Not Found');
        throw apiResponseErr(null, false, 400, 'Game Not Found');
      }

      const selectedGame = selectedGameRows[0];

      if (!selectedGame || typeof selectedGame !== 'object') {
        console.error('Invalid game data');
        throw apiResponseErr(null, false, 400, 'Invalid game data');
      }

      return {
        gameList: [
          {
            id: selectedGame.id || null,
            gameId: selectedGame.gameId || null,
            gameName: selectedGame.gameName || '',
            Description: selectedGame.Description || '',
            markets: [],
          },
        ],
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  createMarket: async (gameId, marketName, participants, timeSpan) => {
    try {
      // console.log("Admin ID:", adminId);
      console.log('Game ID:', gameId);
      const marketId = uuidv4();

      const insertMarketQuery = `
        INSERT INTO Market (marketId, gameId, marketName, participants, timeSpan)
        VALUES (?, ?, ?, ?, ?)
      `;

      const insertMarketResult = await database.execute(insertMarketQuery, [
        marketId,
        gameId,
        marketName,
        participants,
        timeSpan,
      ]);

      const selectMarketQuery = 'SELECT * FROM Market WHERE marketId = ?';
      const selectedMarketRows = await database.execute(selectMarketQuery, [marketId]);

      if (!selectedMarketRows || selectedMarketRows.length === 0) {
        console.error('Market not found');
        throw apiResponseErr(null, false, 400, 'Market Not Found');
      }

      const selectedMarket = selectedMarketRows[0];

      if (!selectedMarket || typeof selectedMarket !== 'object') {
        throw apiResponseErr(null, false, 400, 'Invalid market data');
      }

      return {
        marketList: [
          {
            id: selectedMarket.id || null,
            gameId: selectedMarket.gameId || null,
            marketId: selectedMarket.marketId || null,
            marketName: selectedMarket.marketName || '',
            participants: selectedMarket.participants || '',
            timeSpan: selectedMarket.timeSpan || '',
            runners: [],
          },
        ],
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  createRunner: async (gameId, marketId, runnerNames) => {
    try {
      const getMarketQuery = `
      SELECT id, participants
FROM market
WHERE marketId = ? AND gameId = ?

  `;

      console.log('Game ID:', gameId);
      console.log('Market ID:', marketId);

      const [market] = await database.execute(getMarketQuery, [marketId, gameId]);

      console.log('Market found:', market);

      if (!market) {
        console.error('Market not found for gameId:', gameId, 'and marketId:', marketId);
        throw { message: 'Market not found' };
      }

      console.log('Market found:', market);

      const maxParticipants = market.participants;

      if (runnerNames.length !== maxParticipants) {
        throw apiResponseErr(null, false, 400, 'Number of runners exceeds the maximum allowed participants.');
      }

      const newRunners = runnerNames.map((runnerName) => {
        const runnerId = uuidv4();
        const name = runnerName;
        return {
          runnerId: runnerId,
          runnerName: runnerName,
          gameId: gameId,
          marketId: marketId,
        };
      });

      const insertRunnersQuery = `
            INSERT INTO Runner (runnerId, runnerName, gameId, marketId)
            VALUES ?
        `;

      await database.execute(insertRunnersQuery, [
        newRunners.map((runner) => [runner.runnerId, runner.runnerName, runner.gameId, runner.marketId]),
      ]);

      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  createRate: async (gameId, marketId, runnerId, back, lay) => {
    try {
      const checkRateQuery = `
        SELECT id
        FROM Rate
        WHERE runnerId = ? AND gameId = ? AND marketId = ?
      `;
      const existingRate = await database.execute(checkRateQuery, [runnerId, gameId, marketId]);

      if (existingRate && existingRate.length > 0) {
        const updateRateQuery = `
          UPDATE Rate
          SET Back = ?, Lay = ?
          WHERE runnerId = ? AND gameId = ? AND marketId = ?
        `;
        await database.execute(updateRateQuery, [back, lay, runnerId, gameId, marketId]);
      } else {
        const insertRateQuery = `
          INSERT INTO Rate (runnerId, Back, Lay, marketId, gameId)
          SELECT ?, ?, ?, ?, ? 
          WHERE NOT EXISTS (
            SELECT 1
            FROM Rate
            WHERE marketId = ? AND gameId = ?
          )
        `;
        await database.execute(insertRateQuery, [runnerId, back, lay, marketId, gameId, marketId, gameId]);
      }

      const updateRunnerQuery = `
        UPDATE Runner
        SET rateBack = ?, rateLay = ?
        WHERE runnerId = ? AND gameId = ? AND marketId = ?
      `;
      await database.execute(updateRunnerQuery, [back, lay, runnerId, gameId, marketId]);

      return { success: true };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  checkMarketStatus: async (marketId, status) => {
    try {
      const formattedStatus = status ? 1 : 0;

      const updateMarketQuery = `
      UPDATE Market
      SET status = ?
      WHERE marketId = ?
    `;

      const updateResult = await database.execute(updateMarketQuery, [formattedStatus, marketId]);

      if (updateResult.affectedRows === 0) {
        throw new Error('Market not found.');
      }

      const statusMessage = status ? 'Market is active.' : 'Market is suspended.';

      return { currentStatus: statusMessage };
    } catch (error) {
      throw error;
    }
  },

  updateGame: async (adminId, gameId, gameName, description) => {
    const updateGameQuery = `
  UPDATE game
  SET gameName = COALESCE(?, gameName),
      description = COALESCE(?, description)
  WHERE gameId = ? AND adminId = ?;
`;

    const updateGameValues = [gameName, description, gameId, adminId];

    await database.execute(updateGameQuery, updateGameValues);
  },

  updateMarket: async (adminId, gameId, marketId, marketName, participants, timeSpan) => {
    const updateMarketQuery = `
      UPDATE market
      SET marketName = COALESCE(?, marketName),
          participants = COALESCE(?, participants),
          timeSpan = COALESCE(?, timeSpan)
      WHERE marketId = ? AND gameId = ? AND adminId = ?;
    `;

    const updateMarketValues = [marketName, participants, timeSpan, marketId, gameId, adminId];

    await database.execute(updateMarketQuery, updateMarketValues);
  },

  updateRunner: async (adminId, gameId, marketId, runnerId, runnerName) => {
    const updateRunnerQuery = `
      UPDATE runner
      SET runnerName = COALESCE(?, runnerName)
      WHERE runnerId = ? AND marketId = (
        SELECT marketId FROM Market WHERE marketId = ? AND gameId = ? AND adminId = ?
      );
    `;

    const updateRunnerValues = [runnerName, runnerId, marketId, gameId, adminId];

    await database.execute(updateRunnerQuery, updateRunnerValues);
  },

  updateRate: async (adminId, gameId, marketId, runnerId, back, lay) => {
    const updateRateQuery = `
      UPDATE rate
      SET Back = COALESCE(?, Back),
          Lay = COALESCE(?, Lay)
      WHERE runnerId = ? AND marketId = (
        SELECT marketId FROM Market WHERE marketId = ? AND gameId = ? AND adminId = ?
      );
    `;

    const updateRateValues = [back, lay, runnerId, marketId, gameId, adminId];

    await database.execute(updateRateQuery, updateRateValues);
  },

  CreateSlider: async (sliderCount, data, user) => {
    try {
      if (!Array.isArray(data)) {
        throw { code: 400, message: 'Data must be an array' };
      }

      let documentArray = [];

      for (const element of data) {
        let obj = {};
        const result = await awsS3Obj.addDocumentToS3(element.docBase, element.name, 'game-slider', element.doctype);
        console.log('Result from awsS3Obj.addDocumentToS3:', result);
        obj.image = result.Location;
        obj.text = element.text;
        obj.headingText = element.headingText;
        documentArray.push(obj);
      }

      const newSlider = {
        sliderCount: sliderCount,
        document: JSON.stringify(documentArray),
      };

      const createSliderQuery = 'INSERT INTO Slider SET ?';
      const savedSlider = await database.execute(createSliderQuery, [newSlider]);
      console.log('Saved slider:', savedSlider);

      return true;
    } catch (error) {
      throw error;
    }
  },

  announcements: async (typeOfAnnouncement, announcement, user) => {
    try {
      if (!typeOfAnnouncement || !announcement) {
        throw apiResponseErr(null, false, 400, 'announcement type and announcement are required');
      }

      let announcementId;

      const existingAnnouncementQuery = `
            SELECT announceId
            FROM Announcement
            WHERE typeOfAnnouncement = ?
            ORDER BY id DESC
            LIMIT 1
        `;
      const [existingAnnouncement] = await database.execute(existingAnnouncementQuery, [typeOfAnnouncement]);

      if (existingAnnouncement) {
        announcementId = existingAnnouncement.announceId;
      } else {
        announcementId = uuidv4();
      }

      const insertAnnouncementQuery = `
            INSERT INTO Announcement (announceId, typeOfAnnouncement, announcement, createdBy)
            VALUES (?, ?, ?, ?)
        `;
      await database.execute(insertAnnouncementQuery, [announcementId, typeOfAnnouncement, announcement, user._id]);

      return;
    } catch (error) {
      throw error;
    }
  },

  getAnnouncement: async (announceId) => {
    try {
      const getAnnouncementQuery = `
          SELECT announceId, typeOfAnnouncement, announcement
          FROM Announcement
          WHERE announceId = ?
      `;
      const [announcement] = await database.execute(getAnnouncementQuery, [announceId]);

      if (!announcement) {
        throw apiResponseErr(null, false, 400, 'Announcement not found');
      }

      const getLatestAnnouncementQuery = `
          SELECT announceId, typeOfAnnouncement, announcement
          FROM Announcement
          WHERE typeOfAnnouncement = ?
          ORDER BY id DESC
          LIMIT 1
      `;
      const [latestAnnouncement] = await database.execute(getLatestAnnouncementQuery, [announcement.typeOfAnnouncement]);

      if (!latestAnnouncement) {
        throw apiResponseErr(null, false, 400, 'Latest announcement not found');
      }

      return {
        announcementId: latestAnnouncement.announceId,
        typeOfAnnouncement: latestAnnouncement.typeOfAnnouncement,
        announcement: [latestAnnouncement.announcement],
      };
    } catch (error) {
      throw error;
    }
  },

  updateAnnouncement: async (typeOfAnnouncement, announcement, announceId) => {
    try {
      const updateAnnouncementQuery = `
          UPDATE Announcement
          SET 
              typeOfAnnouncement = COALESCE(?, typeOfAnnouncement),
              announcement = COALESCE(?, announcement)
          WHERE announceId = ?
      `;
      const updateAnnouncementValues = [typeOfAnnouncement, announcement, announceId];

      await database.execute(updateAnnouncementQuery, updateAnnouncementValues);

      const getUpdatedAnnouncementQuery = `
          SELECT *
          FROM Announcement
          WHERE announceId = ?
      `;
      const [updatedAnnouncement] = await database.execute(getUpdatedAnnouncementQuery, [announceId]);

      if (!updatedAnnouncement) {
        throw apiResponseErr(null, false, 400, 'Announcement not found');
      }

      return updatedAnnouncement;
    } catch (error) {
      throw error;
    }
  },
};
