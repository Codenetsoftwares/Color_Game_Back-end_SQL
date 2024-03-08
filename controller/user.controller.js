import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

function executeQuery(sql, values = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, values, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

export const UserController = {
  eligibilityCheck: async (userId, eligibilityCheck) => {
    try {
      const userQuery = "SELECT * FROM user WHERE id = ?";
      const user = await executeQuery(userQuery, [userId]);

      if (user.length === 0) {
        throw { code: 404, message: "User not found" };
      }

      const updateQuery = "UPDATE user SET eligibilityCheck = ? WHERE id = ?";
      const updatedRows = await executeQuery(updateQuery, [
        eligibilityCheck ? 1 : 0,
        userId,
      ]);

      if (updatedRows.affectedRows > 0) {
        return {
          message: eligibilityCheck ? "User Eligible" : "User Not Eligible",
        };
      } else {
        throw { code: 500, message: "Failed to update user eligibility" };
      }
    } catch (err) {
      throw { code: err.code || 500, message: err.message };
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
  
};


