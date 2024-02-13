  import mysql from "mysql2";
  import bcrypt from "bcrypt";
  import jwt from "jsonwebtoken";
  import dotenv from "dotenv";
  import uuid from 'uuid';

  const uuidv4 = uuid.v4;
  

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
          console.log("Query results:", results);
          if (results instanceof Array) {
            if (results.length > 0) {
              resolve(results);
            } else {
              reject(new Error("Query result is an empty array"));
            }
          } else {                 
            resolve(results);
          }
        }
      });
    });
  }


  export const AdminController = {
      createAdmin: async (data) => {
  try {
  if (!data.userName || !data.password || !data.roles || data.roles.length === 0) {
  throw { code: 400, message: "Invalid input data" };
  }

  const existingAdminQuery = "SELECT * FROM Admin WHERE userName = ?";
  const existingAdmin = await executeQuery(existingAdminQuery, [data.userName]);
  if (existingAdmin.length > 0) {
  throw { code: 409, message: "Admin Already Exists" };
  }

  const encryptedPassword = await bcrypt.hash(data.password, 10);

  const insertAdminQuery = `
  INSERT INTO Admin (userName, password, roles)
  VALUES (?, ?, ?)
  `;

  await executeQuery(insertAdminQuery, [data.userName, encryptedPassword, JSON.stringify(data.roles)]);
  } catch (err) {
  console.error(err);
  throw { code: 500, message: "Failed to save user" };
  }
  },


  GenerateAdminAccessToken: async (userName, password, persist) => {
  try {

  if (!userName) {
  throw { code: 400, message: "Invalid value for: User Name" };
  }
  if (!password) {
  throw { code: 400, message: "Invalid value for: password" };
  }

  const getUserQuery = "SELECT * FROM Admin WHERE userName = ?";
  const [existingUser] = await executeQuery(getUserQuery, [userName]);

  if (!existingUser) {
  throw { code: 401, message: "Invalid User Name or password" };
  }


  const passwordValid = await bcrypt.compare(password, existingUser.password);
  if (!passwordValid) {
  throw { code: 401, message: "Invalid User Name or Password" };
  }

  const accessTokenPayload = {
  id: existingUser.id,

  userName: existingUser.userName,

  };

  const accessToken = jwt.sign(
  accessTokenPayload,
  process.env.JWT_SECRET_KEY,
  {
    expiresIn: persist ? "1y" : "8h",
  }
  );


  const response = {
  userName: existingUser.userName,
  accessToken: accessToken,
    roles: existingUser.roles,

  };

  return response;
  } catch (err) {
  throw err; 
  }
  },


  createUser: async (data) => {
  try {
  if (!data.firstName || !data.lastName || !data.userName || !data.phoneNumber || !data.password) {
  throw { code: 400, message: "Invalid input data" };
  }

  const existingUserQuery = "SELECT * FROM User WHERE userName = ?";
  const existingUser = await executeQuery(existingUserQuery, [data.userName]);

  if (existingUser.length > 0) {
  throw { code: 409, message: "User Already Exists" };
  }

  const encryptedPassword = await bcrypt.hash(data.password, 10);

  const insertUserQuery = `
  INSERT INTO User (firstName, lastName, userName, phoneNumber, password)
  VALUES (?, ?, ?, ?, ?)
  `;

  await executeQuery(insertUserQuery, [data.firstName, data.lastName, data.userName, data.phoneNumber, encryptedPassword]);
  } catch (err) {
  console.error(err);
  throw { code: 500, message: err.message };
  }
  },


  loginUser: async(userName,password, persist) => {
  try {

  if (!userName) {
    throw { code: 400, message: "Invalid value for: User Name" };
  }
  if (!password) {
    throw { code: 400, message: "Invalid value for: password" };
  }

  const getUserQuery = "SELECT * FROM User WHERE userName = ?";
  const [existingUser] = await executeQuery(getUserQuery, [userName]);

  if (!existingUser) {
    throw { code: 401, message: "Invalid User Name or password" };
  }


  const passwordValid = await bcrypt.compare(password, existingUser.password);
  if (!passwordValid) {
    throw { code: 401, message: "Invalid User Name or Password" };
  }

  const accessTokenPayload = {
    id: existingUser.id,

    userName: existingUser.userName,
    
  };

  const accessToken = jwt.sign(
    accessTokenPayload,
    process.env.JWT_SECRET_KEY,
    {
        expiresIn: persist ? "1y" : "8h",
    }
  );


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
      const adminQuery = "SELECT * FROM Admin WHERE JSON_UNQUOTE(JSON_EXTRACT(roles, '$[0]')) = 'superAdmin'";
      console.log("adminQuery", adminQuery);
  
      const [adminRows] = await executeQuery(adminQuery);
      console.log("adminRows", adminRows);
  
      if (!adminRows || adminRows.length === 0) {
        console.error("Admin Not Found");
        throw { code: 404, message: "Admin Not Found" };
      }
  
      const gameId = uuidv4();
  
      const insertGameQuery = "INSERT INTO Game (gameName, Description, gameId) VALUES (?, ?, ?)";
      const insertGameResult = await executeQuery(insertGameQuery, [gameName, Description, gameId]);
  
      console.log("insertGameResult:", insertGameResult);
  
      const selectGameQuery = "SELECT * FROM Game WHERE id = ?";
      const selectedGameRows = await executeQuery(selectGameQuery, [insertGameResult.insertId]);
  
      console.log("selectedGameRows:", selectedGameRows);
  
      if (!selectedGameRows || selectedGameRows.length === 0) {
        console.error("Game Not Found");
        throw { code: 404, message: "Game Not Found" };
      }
  
      const selectedGame = selectedGameRows[0];
  
      if (!selectedGame || typeof selectedGame !== 'object') {
        console.error("Invalid game data");
        throw { code: 500, message: "Invalid game data" };
      }
  
      return {
        gameList: [{
          id: selectedGame.id || null,
          gameId: selectedGame.gameId || null,
          gameName: selectedGame.gameName || '',
          Description: selectedGame.Description || '',
          markets: []
        }],
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  
  createMarket: async (gameId, marketName, participants, timeSpan) => {
    try {
      // Generate a UUID for the market
      const marketId = uuidv4();
  
      const insertMarketQuery = `
        INSERT INTO Market (marketId, gameId, marketName, participants, timeSpan)
        VALUES (?, ?, ?, ?, ?)
      `;
  
      const insertMarketResult = await executeQuery(insertMarketQuery, [marketId, gameId, marketName, participants, timeSpan]);
  
      // Use the generated marketId for further operations
      const selectMarketQuery = "SELECT * FROM Market WHERE marketId = ?";
      const selectedMarketRows = await executeQuery(selectMarketQuery, [marketId]);
  
      if (!selectedMarketRows || selectedMarketRows.length === 0) {
        console.error("Market not found");
        throw { code: 404, message: "Market not found" };
      }
  
      const selectedMarket = selectedMarketRows[0];
  
      if (!selectedMarket || typeof selectedMarket !== 'object') {
        console.error("Invalid market data");
        throw { code: 500, message: "Invalid market data" };
      }
  
      return {
        marketList: [{
          id: selectedMarket.id || null,
          gameId: selectedMarket.gameId || null,
          marketId: selectedMarket.marketId || null,
          marketName: selectedMarket.marketName || '',
          participants: selectedMarket.participants || '',
          timeSpan: selectedMarket.timeSpan || '',
          runners: []
        }],
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
      FROM Market
      WHERE marketId = ? AND gameId = ?
  `;
  

        const [market] = await executeQuery(getMarketQuery, [marketId, gameId]);

        if (!market) {
            console.error("Market not found for gameId:", gameId, "and marketId:", marketId);
            throw { message: "Market not found" };
        }

        console.log("Market found:", market);

        const maxParticipants = market.participants;

        if (runnerNames.length > maxParticipants) {
            console.error("Number of runners exceeds the maximum allowed participants.");
            throw { message: "Number of runners exceeds the maximum allowed participants." };
        }

        const newRunners = runnerNames.map((runnerName) => {
            const runnerId = uuidv4();
            const name = runnerName;
            return {
                runnerId: runnerId,
                name: name,
                gameId: gameId,
                marketId: marketId,
            };
        });

        const insertRunnersQuery = `
            INSERT INTO Runner (runnerId, name, gameId, marketId)
            VALUES ?
        `;

        await executeQuery(insertRunnersQuery, [newRunners.map(runner => [
            runner.runnerId,
            runner.name,
            runner.gameId,
            runner.marketId
        ])]);

        return { success: true };
    } catch (error) {
        console.error("Error in createRunner:", error);
        throw error;
    }
},


createRate: async (gameId, marketId, runnerId, back, lay) => {
  try {
      // Check if a rate already exists for the given marketId
      const checkRateQuery = `
          SELECT id
          FROM Rate
          WHERE runnerId = ? AND gameId = ? AND marketId = ?
      `;
      const existingRate = await executeQuery(checkRateQuery, [runnerId, gameId, marketId]);

      if (existingRate && existingRate.length > 0) {
          // If a rate already exists, update the existing rate
          const updateRateQuery = `
              UPDATE Rate
              SET Back = ?, Lay = ?
              WHERE runnerId = ? AND gameId = ? AND marketId = ?
          `;

          await executeQuery(updateRateQuery, [back, lay, runnerId, gameId, marketId]);
      } else {
          // If no rate exists, insert a new rate
          const insertRateQuery = `
              INSERT INTO Rate (runnerId, Back, Lay, marketId, gameId)
              VALUES (?, ?, ?, ?, ?)
          `;

          await executeQuery(insertRateQuery, [runnerId, back, lay, marketId, gameId]);

      }

      // Update Runner table with new back and lay values
      const updateRunnerQuery = `
          UPDATE Runner
          SET rateBack = ?, rateLay = ?
          WHERE runnerId = ? AND gameId = ? AND marketId = ?
      `;

      await executeQuery(updateRunnerQuery, [back, lay, runnerId, gameId, marketId]);

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

    const updateResult = await executeQuery(updateMarketQuery, [formattedStatus, marketId]);

    if (updateResult.affectedRows === 0) {
      throw new Error("Market not found.");
    }

    const statusMessage = status ? "Market is active." : "Market is suspended.";

    return { currentStatus: statusMessage };
  } catch (error) {
    throw error;
  }
},


  }

