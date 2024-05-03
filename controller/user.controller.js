import { database } from '../controller/database.controller.js'
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import { apiResponseErr, apiResponsePagination, apiResponseSuccess } from '../middleware/serverError.js';


// export const UserController = {

//   eligibilityCheck: async (userId, eligibilityCheck) => {
//     try {
//       const userQuery = 'SELECT * FROM user WHERE id = ?';
//       const user = await database.execute(userQuery, [userId]);

//       if (user.length === 0) {
//         throw apiResponseErr(null, false, 400, 'User not found' );
//       }

//       const updateQuery = 'UPDATE user SET eligibilityCheck = ? WHERE id = ?';
//       const updatedRows = await database.execute(updateQuery, [eligibilityCheck ? 1 : 0, userId]);

//       if (updatedRows.affectedRows > 0) {
//         return {
//           message: eligibilityCheck ? 'User Eligible' : 'User Not Eligible',
//         };
//       } else {
//         throw apiResponseErr(null, false, 400, 'Failed to update user eligibility' );

//       }
//     } catch (error) {
//       throw error
//     }
//   },

//   getGameData: async () => {
//     try {
//       const getGamesQuery = 'SELECT * FROM game';
//       const getMarketsQuery = 'SELECT * FROM market WHERE gameId = ?';
//       const getRunnersQuery = 'SELECT * FROM runner WHERE marketId = ?';

//       const games = await database.execute(getGamesQuery);

//       for (const game of games) {
//         game.markets = await database.execute(getMarketsQuery, [game.gameId]);

//         for (const market of game.markets) {
//           market.runners = await database.execute(getRunnersQuery, [market.marketId]);
//         }
//       }

//       return games;
//     } catch (error) {
//       console.error('Error fetching data from the database:', error);
//       return [];
//     }
//   },

//   formatGameData: (inputData) => {
//     if (!inputData || inputData.length === 0) {
//       console.log('No data found in the database.');
//       return [];
//     }

//     const formattedGameData = inputData.map((game) => {
//       return {
//         gameId: game.gameId,
//         gameName: game.gameName,
//         Description: game.Description,
//         markets: game.markets.map((market) => {
//           return {
//             marketId: market.marketId,
//             marketName: market.marketName,
//             participants: market.participants,
//             timeSpan: market.timeSpan,
//             status: market.status,
//             runners: market.runners.map((runner) => {
//               return {
//                 runnerId: runner.runnerId,
//                 runnerName: runner.runnerName,
//                 rate: [
//                   {
//                     Back: runner.rateBack,
//                     Lay: runner.rateLay,
//                   },
//                 ],
//               };
//             }),
//           };
//         }),
//       };
//     });

//     return formattedGameData;
//   },

//   getAnnouncementUser: async (typeOfAnnouncement) => {
//     try {
//       const getAnnouncementQuery = `
//             SELECT announceId, typeOfAnnouncement, announcement
//             FROM Announcement
//             WHERE typeOfAnnouncement = ?
//         `;
//       const [announcement] = await database.execute(getAnnouncementQuery, [typeOfAnnouncement]);

//       if (!announcement) {
//         throw apiResponseErr(null, false, 400, 'Announcement not found');
//       }

//       const getLatestAnnouncementQuery = `
//             SELECT announceId, typeOfAnnouncement, announcement
//             FROM Announcement
//             WHERE typeOfAnnouncement = ?
//             ORDER BY id DESC
//             LIMIT 1
//         `;
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

//   getAnnouncementTypes: async () => {
//     try {
//       const getAnnouncementTypesQuery = `
//             SELECT *
//             FROM Announcement
//         `;
//       const announcementTypes = await database.execute(getAnnouncementTypesQuery);
//       return announcementTypes.map((row) => ({
//         announceId: row.announceId,
//         typeOfAnnouncement: row.typeOfAnnouncement,
//       }));
//     } catch (error) {
//       throw error;
//     }
//   },
// };


export const loginUser = async (req, res) => {
  try {
    const { userName, password } = req.body;
    console.log("req", req.body)
    if (!userName || !password) {
      return res.status(400).send(apiResponseErr(null, false, 400, 'Invalid username or password'));
    }

    const [rows] = await database.execute('SELECT * FROM User WHERE userName = ?', [userName]);
    const existingUser = rows[0];

    if (!existingUser || !existingUser.password) {
      return res.status(401).send(apiResponseErr(null, false, 401, 'Invalid username or password'));
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);

    if (!isPasswordValid) {
      return res.status(401).send(apiResponseErr(null, false, 401, 'Invalid username or password'));
    }

    const accessTokenResponse = {
      id: existingUser.id,
      userName: existingUser.userName,
      isEighteen: existingUser.eligibilityCheck,
      UserType: existingUser.userType || 'User',
      wallet: existingUser.wallet
    };

    const accessToken = jwt.sign(accessTokenResponse, process.env.JWT_SECRET_KEY, {
      expiresIn: '1d',
    });

    res.status(200).send(apiResponseSuccess(accessToken, true, 200, 'Login successful'));

  } catch (error) {
    res
        .status(500)
        .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};

export const eligibilityCheck = async (req, res) => {
  try {
    const  id  = req.params.userId; 
    const { eligibilityCheck } = req.body;

    const userQuery = 'SELECT * FROM User WHERE id = ?';
    const [user] = await database.execute(userQuery, [id]); 

    if (!user) {
      return res.status(400).send(apiResponseErr(null, false, 400, 'User not found'));
    }

    const updateQuery = 'UPDATE User SET eligibilityCheck = ? WHERE id = ?';
    const [updatedRows] = await database.execute(updateQuery, [eligibilityCheck ? 1 : 0, id]);

    if (updatedRows.affectedRows > 0) {
      return res.status(200).send({
        message: eligibilityCheck ? 'User Eligible' : 'User Not Eligible',
      });
    } else {
      return res.status(400).send(apiResponseErr(null, false, 400, 'Failed to update user eligibility'));
    }
  } catch (error) {
    res
    .status(500)
    .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { oldPassword, password, confirmPassword } = req.body;
    const userId = req.user[0].id;
    const [userRows] = await database.execute('SELECT * FROM User WHERE id = ?', [userId]);
    const user = userRows[0]; 
    if (!user) {
      return res.status(404).send(apiResponseErr(null, false, 401, 'User Not Found'));
    }
    const oldPasswordIsCorrect = await bcrypt.compare(oldPassword, user.password);
    if (!oldPasswordIsCorrect) {
      return res.status(400).send(apiResponseErr(null, false, 401, 'Invalid old password'));
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    await database.execute('UPDATE User SET password = ? WHERE id = ?', [hashedPassword, userId]);
    res.status(200).send(apiResponseSuccess(user, true, 200, 'Password Reset Successfully'));
  } catch (error) {
    res
    .status(500)
    .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};

export const userGame=async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
    const searchQuery = req.query.search || '';

    const fetchGameDataQuery = `
      SELECT gameId, gameName, description
      FROM Game
    `;
    const [fetchGameDataResult] = await database.execute(fetchGameDataQuery);

    if (!fetchGameDataResult || fetchGameDataResult.length === 0) {
      return res.status(400).json(apiResponseErr(null, false, 400, 'Data Not Found'));
    }

    const gameData = fetchGameDataResult.map(row => ({
      gameId: row.gameId,
      gameName: row.gameName,
      description: row.description,
    }));

    const filteredGameData = gameData.filter(
      (game) => game.gameName && game.gameName.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const totalItems = filteredGameData.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    let paginatedGameData = [];
    if (page && pageSize) {
      paginatedGameData = filteredGameData.slice((page - 1) * pageSize, page * pageSize);
    } else {
      paginatedGameData = filteredGameData;
    }

    const paginationData = apiResponsePagination(page, totalPages, totalItems);
    return res.status(200).send(apiResponseSuccess(paginatedGameData, true, 200, 'Success', paginationData));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};

export const userMarket = async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const searchQuery = req.query.search ? req.query.search.toLowerCase() : '';

    const marketsQuery = `
      SELECT Market.marketId, Market.marketName, Market.timeSpan, Market.participants, Market.isActive
      FROM Market
      WHERE Market.gameId = ?
        AND LOWER(Market.marketName) LIKE CONCAT('%', ?, '%')
    `;

    const [markets] = await database.execute(marketsQuery, [gameId, searchQuery]);

    const totalItems = markets.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize;

    const paginatedMarkets = markets.slice(startIndex, endIndex);

    const paginationData = {
      currentPage: page,
      totalPages: totalPages,
      totalItems: totalItems
    };

    return res.status(200).send(apiResponseSuccess(paginatedMarkets, true, 200, 'Success', paginationData));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};

export const userRunners = async (req, res) => {
  try {
    const marketId = req.params.marketId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const searchQuery = req.query.search || '';

    const runnersQuery = `
      SELECT Runner.*, Rate.Back, Rate.Lay
      FROM Runner
      LEFT JOIN Rate ON Runner.runnerId = Rate.runnerId
      WHERE Runner.marketId = ?
    `;
    const [runnersResult] = await database.execute(runnersQuery, [marketId]);

    const runners = runnersResult.map(row => ({
      runnerId: row.runnerId,
      runnerName: row.runnerName,
      isWin: row.isWin,
      back: row.Back,
      lay: row.Lay,
    }));

    const filteredRunners = runners.filter(runner =>
      runner.runnerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalItems = filteredRunners.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    const paginatedRunners = filteredRunners.slice((page - 1) * pageSize, page * pageSize);

    const paginationData = apiResponsePagination(page, totalPages, totalItems);

    res.status(200).send(apiResponseSuccess(paginatedRunners, true, 200, 'success', paginationData));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};

export const getAllGameData = async (req, res) => {
  try {
    const gameDataQuery = `
      SELECT
        G.gameId,
        G.gameName,
        G.description,
        M.marketId,
        M.marketName,
        M.participants,
        M.timeSpan,
        M.announcementResult,
        M.isActive,
        R.runnerId,
        R.runnerName,
        R.isWin,
        R.bal,
        R.Back,
        R.Lay
      FROM Game G
      LEFT JOIN Market M ON G.gameId = M.gameId
      LEFT JOIN Runner R ON M.marketId = R.marketId
    `;
    const [gameDataRows] = await database.execute(gameDataQuery);

    const allGameData = gameDataRows.reduce((acc, row) => {
      let gameIndex = acc.findIndex(game => game.gameId === row.gameId);
      if (gameIndex === -1) {
        acc.push({
          gameId: row.gameId,
          gameName: row.gameName,
          description: row.description,
          markets: []
        });
        gameIndex = acc.length - 1; 
      }
      
      let marketIndex = acc[gameIndex].markets.findIndex(market => market.marketId === row.marketId);
      if (marketIndex === -1) {
        acc[gameIndex].markets.push({
          marketId: row.marketId,
          marketName: row.marketName,
          participants: row.participants,
          timeSpan: row.timeSpan,
          announcementResult: row.announcementResult,
          isActive: row.isActive,
          runners: []
        });
        marketIndex = acc[gameIndex].markets.length - 1; 
      }
      if (row.runnerId) {
        acc[gameIndex].markets[marketIndex].runners.push({
          runnerId: row.runnerId,
          runnerName: row.runnerName,
          isWin: row.isWin,
          bal: row.bal,
          Back: row.Back,
          Lay: row.Lay
        });
      }

      return acc;
    }, []);

    
    res.status(200).send(apiResponseSuccess(allGameData, true, 200, 'Success'));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
}

export const filteredGameData =async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const gameDataQuery = `
      SELECT
        G.gameId,
        G.gameName,
        G.description,
        M.marketId,
        M.marketName,
        M.participants,
        M.timeSpan,
        M.announcementResult,
        M.isActive,
        R.runnerId,
        R.runnerName,
        R.isWin,
        R.bal,
        RA.Back,
        RA.Lay
      FROM Game G
      LEFT JOIN Market M ON G.gameId = M.gameId
      LEFT JOIN Runner R ON M.marketId = R.marketId
      LEFT JOIN Rate RA ON R.runnerId = RA.runnerId
      WHERE G.gameId = ?
    `;
    const [gameDataRows] = await database.execute(gameDataQuery, [gameId]);

    if (gameDataRows.length === 0) {
      throw apiResponseErr(null, false, 400, 'Game not found');
    }
    const { gameName, description } = gameDataRows[0];
    const gameData = gameDataRows.reduce((acc, row) => {
      if (!acc.gameId) {
        acc.gameId = row.gameId;
        acc.gameName = gameName; 
        acc.description = description; 
        acc.markets = {};
      }

      if (!acc.markets[row.marketId]) {
        acc.markets[row.marketId] = {
          marketId: row.marketId,
          marketName: row.marketName,
          participants: row.participants,
          timeSpan: row.timeSpan,
          announcementResult: row.announcementResult,
          isActive: row.isActive,
          runners: []
        };
      }
      acc.markets[row.marketId].runners.push({
        runnerId: row.runnerId,
        runnerName: row.runnerName,
        isWin: row.isWin,
        bal: row.bal,
        Back: row.Back,
        Lay: row.Lay
      });

      return acc;
    }, {});
    const marketsArray = Object.values(gameData.markets);
    res.status(200).send(apiResponseSuccess({ gameId, gameName, description, markets: marketsArray }, true, 200, 'Success'));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
}

export const getAnnouncementUser = async (req, res) => {
  try {
    const announceId = req.params.announceId;
    const announceIdString = String(announceId);
    const announcementQuery = `
      SELECT *
      FROM Announcement
      WHERE announceId = ?
    `;
    const [announcementData] = await database.execute(announcementQuery, [announceIdString]);

    if (announcementData.length === 0) {
      throw apiResponseErr(null, false, 400, 'Announcement not found');
    }
    const latestAnnouncement = announcementData.reduce((latest, current) => {
      if (latest.announceId < current.announceId) {
        return current;
      }
      return latest;
    });
    res.status(200).send(apiResponseSuccess({
      announcementId: latestAnnouncement.announceId,
      typeOfAnnouncement: latestAnnouncement.typeOfAnnouncement,
      announcement: [latestAnnouncement.announcement],
    }, true, 200, 'success'));

  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
}

export const getAnnouncementTypes=async (req, res) => {
  try {
    const announcementTypesQuery = `
      SELECT announceId, typeOfAnnouncement
      FROM Announcement
    `;
    const [announcementTypesData] = await database.execute(announcementTypesQuery);
    const announcementTypes = announcementTypesData.map((announcement) => ({
      announceId: announcement.announceId,
      typeOfAnnouncement: announcement.typeOfAnnouncement,
    }));
    res.status(200).send(apiResponseSuccess(announcementTypes, true, 200, 'Success'));

  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
}

export const userGif =async (req, res) => {
  try {
    // SQL query to retrieve GIF data
    const gifQuery = `
      SELECT imageId, image, text, headingText, isActive
      FROM Gif
    `;
    
    // Execute the query
    const [gifData] = await database.execute(gifQuery);

    // Map the results to the required format
    const formattedGif = gifData.map((data) => ({
      imageId: data.imageId,
      image: data.image,
      text: data.text,
      headingText: data.headingText,
      isActive: data.isActive,
    }));

    // Send the formatted GIF data as a response
    res.status(200).send(apiResponseSuccess(formattedGif, true, 200));

  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
}