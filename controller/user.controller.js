import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

import { executeQuery } from '../DB/db.js';
import { error } from 'console';

export const UserController = {
  eligibilityCheck: async (userId, eligibilityCheck) => {
    try {
      const userQuery = 'SELECT * FROM user WHERE id = ?';
      const user = await executeQuery(userQuery, [userId]);

      if (user.length === 0) {
        throw apiResponseErr(null, false, 400, 'User not found' );
      }

      const updateQuery = 'UPDATE user SET eligibilityCheck = ? WHERE id = ?';
      const updatedRows = await executeQuery(updateQuery, [eligibilityCheck ? 1 : 0, userId]);

      if (updatedRows.affectedRows > 0) {
        return {
          message: eligibilityCheck ? 'User Eligible' : 'User Not Eligible',
        };
      } else {
        throw apiResponseErr(null, false, 400, 'Failed to update user eligibility' );

      }
    } catch (error) {
      throw error
    }
  },

  getGameData: async () => {
    try {
      const getGamesQuery = 'SELECT * FROM game';
      const getMarketsQuery = 'SELECT * FROM market WHERE gameId = ?';
      const getRunnersQuery = 'SELECT * FROM runner WHERE marketId = ?';

      const games = await executeQuery(getGamesQuery);

      for (const game of games) {
        game.markets = await executeQuery(getMarketsQuery, [game.gameId]);

        for (const market of game.markets) {
          market.runners = await executeQuery(getRunnersQuery, [market.marketId]);
        }
      }

      return games;
    } catch (error) {
      console.error('Error fetching data from the database:', error);
      return [];
    }
  },

  formatGameData: (inputData) => {
    if (!inputData || inputData.length === 0) {
      console.log('No data found in the database.');
      return [];
    }

    const formattedGameData = inputData.map((game) => {
      return {
        gameId: game.gameId,
        gameName: game.gameName,
        Description: game.Description,
        markets: game.markets.map((market) => {
          return {
            marketId: market.marketId,
            marketName: market.marketName,
            participants: market.participants,
            timeSpan: market.timeSpan,
            status: market.status,
            runners: market.runners.map((runner) => {
              return {
                runnerId: runner.runnerId,
                runnerName: runner.runnerName,
                rate: [
                  {
                    Back: runner.rateBack,
                    Lay: runner.rateLay,
                  },
                ],
              };
            }),
          };
        }),
      };
    });

    return formattedGameData;
  },

  getAnnouncementUser: async (typeOfAnnouncement) => {
    try {
      const getAnnouncementQuery = `
            SELECT announceId, typeOfAnnouncement, announcement
            FROM Announcement
            WHERE typeOfAnnouncement = ?
        `;
      const [announcement] = await executeQuery(getAnnouncementQuery, [typeOfAnnouncement]);

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
      const [latestAnnouncement] = await executeQuery(getLatestAnnouncementQuery, [announcement.typeOfAnnouncement]);

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

  getAnnouncementTypes: async () => {
    try {
      const getAnnouncementTypesQuery = `
            SELECT *
            FROM Announcement
        `;
      const announcementTypes = await executeQuery(getAnnouncementTypesQuery);
      return announcementTypes.map((row) => ({
        announceId: row.announceId,
        typeOfAnnouncement: row.typeOfAnnouncement,
      }));
    } catch (error) {
      throw error;
    }
  },
};
