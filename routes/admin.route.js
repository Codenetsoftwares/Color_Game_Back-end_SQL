import { AdminController } from "../controller/admin.controller.js";
import { Authorize } from "../middleware/auth.js";

import mysql from "mysql2"
import dotenv from "dotenv";

import { v4 as uuidv4 } from 'uuid';



dotenv.config();

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Function to execute SQL queries
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


export const AdminRoute = (app) => {

  app.post("/api/admin-create",
    async (req, res) => {
      try {
        const userData = req.body;

        await AdminController.createAdmin(userData);

        res.status(200).send({ code: 200, message: "Admin created successfully" });
      } catch (error) {
        console.error(error);
        res.status(error.code || 500).send({ message: error.message || "Failed to create admin" });
      }
    });

  app.post("/api/admin-login", async (req, res) => {
    try {
      const { userName, password, persist } = req.body;

      const tokenData = await AdminController.GenerateAdminAccessToken(userName, password, persist);

      res.status(200).send(tokenData);
    } catch (err) {
      console.error('Error:', err.message);
      res.status(err.code || 500).send({ code: err.code || 500, message: err.message });
    }
  });



  app.post("/api/user-create", Authorize(["Admin"]), async (req, res) => {
    try {
      await AdminController.createUser(req.body);
      res.status(200).send({ code: 200, message: 'User registered successfully!' });
    } catch (error) {
      res.status(error.code || 500).send({ code: error.code || 500, message: error.message || "Internal Server Error" });
    }
  });
  

  app.post("/api/user-login", async (req, res) => {
    try {
      const { userName, password, persist } = req.body;

      const tokenData = await AdminController.loginUser(userName, password, persist);

      res.status(200).send(tokenData);
    } catch (err) {
      console.error('Error:', err.message);
      res.status(err.code || 500).send({ code: err.code || 500, message: err.message });
    }
  });


  app.post("/api/create-games", Authorize(["Admin"]), async (req, res) => {
    try {
      const { gameName, Description } = req.body;
      const adminId = req.user.adminId; 
      const result = await AdminController.createGame(adminId, gameName, Description);
      const games = result.gameList;
      res.status(200).send({ code: 200, message: "Game Create Successfully", games });
    } catch (err) {
      res.status(Number.isInteger(err.code) ? err.code : 500).send({ code: err.code, message: err.message });
    }
  });
  

  app.post("/api/create-markets/:gameId",Authorize(["Admin"]), async (req, res) => {
    try {
      const { gameId } = req.params;
      const { marketName, participants, timeSpan } = req.body;
      const adminId = req.user.adminId; 
      console.log("adminId: " + adminId);
      const markets = await AdminController.createMarket(adminId, gameId, marketName, participants, timeSpan);


      res.status(200).send({ code: 200, message: "Market created successfully", markets });
    } catch (err) {
      res.status(500).send({ code: err.code, message: err.message });
    }
  });



  app.post("/api/create-runners/:gameId/:marketId",Authorize(["Admin"]), async (req, res) => {
    try {
      console.log("User:", req.user);
      const { gameId, marketId } = req.params;
      const { runnerNames } = req.body;
      const adminId = req.user.adminId;
      console.log("adminId: " + adminId);
      const runners = await AdminController.createRunner(adminId,gameId, marketId, runnerNames);
      res.status(200).send({ code: 200, message: "Runner Create Successfully", runners });
    } catch (err) {
      res.status(500).send({ code: err.code, message: err.message });
    }
  });

  app.post("/api/create-rate/:gameId/:marketId/:runnerId",Authorize(["Admin"]), async (req, res) => {
    try {
      const { gameId, marketId, runnerId } = req.params;
      const { back, lay } = req.body;

      const rates = await AdminController.createRate(gameId, marketId, runnerId, back, lay);

      res.status(200).send({ code: 200, message: "Rate created successfully", rates });
    } catch (err) {
      res.status(500).send({ code: err.code || 500, message: err.message || "Internal Server Error" });
    }
  });

  app.get("/api/All-Games",Authorize(["Admin"]), async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
      const searchQuery = req.query.search || '';

      const getGamesQuery = `
        SELECT G.id, G.gameName, G.Description
        FROM Game G
        WHERE EXISTS (
          SELECT 1
          FROM Admin A
          WHERE JSON_UNQUOTE(JSON_EXTRACT(A.roles, '$[0]')) = 'Admin'
        )
        AND G.gameName LIKE ?
      `;


      const games = await executeQuery(getGamesQuery, [`%${searchQuery}%`]);


      const totalItems = games.length;

      let paginatedGames;
      let totalPages = 1;

      if (page && pageSize) {
        totalPages = Math.ceil(totalItems / pageSize);
        paginatedGames = games.slice((page - 1) * pageSize, page * pageSize);
      } else {
        paginatedGames = games;
      }

      res.status(200).send({
        games: paginatedGames,
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
      });
    } catch (error) {
      res.status(500).send({
        code: error.code || 500,
        message: error.message || "Internal Server Error",
      });
    }
  });


  app.get("/api/All-Markets/:gameId",Authorize(["Admin"]), async (req, res) => {
    try {
      const gameId = req.params.gameId;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const searchQuery = req.query.search || '';

      const getMarketsQuery = `
            SELECT M.marketName, M.participants, M.timeSpan, M.status
            FROM Game G
            JOIN Market M ON G.gameId = M.gameId
            WHERE G.gameId = ? AND M.marketName LIKE ?
        `;

      const markets = await executeQuery(getMarketsQuery, [gameId, `%${searchQuery}%`]);

      const totalItems = markets.length;

      let paginatedMarkets;
      let totalPages = 1;

      if (page && pageSize) {
        totalPages = Math.ceil(totalItems / pageSize);
        paginatedMarkets = markets.slice((page - 1) * pageSize, page * pageSize);
      } else {
        paginatedMarkets = markets;
      }

      res.status(200).send({
        markets: paginatedMarkets,
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
      });

    } catch (error) {
      res.status(500).send({
        code: error.code || 500,
        message: error.message || "Internal Server Error",
      });
    }
  });


  app.get("/api/All-Runners/:gameId/:marketId", Authorize(["Admin"]), async (req, res) => {
    try {
      const gameId = req.params.gameId;
      const marketId = req.params.marketId;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const searchQuery = req.query.search || '';
  
      const getRunnersQuery = `
        SELECT R.name, R.rateBack, R.rateLay
        FROM Runner R
        JOIN Market M ON R.marketId = M.marketId
        WHERE M.marketId = ? AND R.name LIKE ?
      `;
  
      const runners = await executeQuery(getRunnersQuery, [marketId, `%${searchQuery}%`]);
  
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
        name: runner.name,
        rateBack: runner.rateBack,
        rateLay: runner.rateLay,
      }));
  
      res.status(200).send({
        runners: runnersList,
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        gameId: gameId,
        marketId: marketId,
      });
    } catch (error) {
      res.status(500).send({
        code: error.code || 500,
        message: error.message || "Internal Server Error",
      });
    }
  });
  
  app.post("/api/update-market-status/:marketId",Authorize(["Admin"]), async (req, res) => {
    try {
      const { marketId } = req.params;
      const { status } = req.body;

      const result = await AdminController.checkMarketStatus(marketId, status);

      res.status(200).json(result);
    } catch (error) {
      console.error(error);

      if (error.message === "Market not found." || error.message === "Invalid status format. It should be a boolean.") {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: "Internal server error." });
    }
  });

  app.put("/api/update", Authorize(["Admin"]), async (req, res) => {
    try {
      const { gameId, marketId, runnerId } = req.query;
      const { gameName, description, marketName, participants, timeSpan, RunnerName, back, lay } = req.body;
  
      const admin = await executeQuery("SELECT * FROM Admin WHERE roles = 'Admin' LIMIT 1");
  
      if (!admin || admin.length === 0) {
        throw { code: 404, message: "Admin not found" };
      }
  
      if (gameId) {
        await AdminController.updateGame(admin[0].adminId, gameId, gameName, description);
      }
  
      if (marketId) {
        await AdminController.updateMarket(admin[0].adminId, gameId, marketId, marketName, participants, timeSpan);
      }
  
      if (runnerId) {
        await AdminController.updateRunner(admin[0].adminId, gameId, marketId, runnerId, RunnerName);
        await AdminController.updateRate(admin[0].adminId, gameId, marketId, runnerId, back, lay);
      }
  
      // Assuming `admin.save()` is not necessary in a SQL context
  
      res.json({
        success: true,
        message: "Edit successful",
        gameList: admin[0].gameList,
      });
    } catch (error) {
      res.status(error.code || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  });
  

  
  app.post("/api/admin/slider-text-img/dynamic", Authorize(["Admin"]), async (req, res) => {
    try {
      const { sliderCount, data } = req.body; 
      const createSlider = await AdminController.CreateSlider(sliderCount, data, req.user); 
      if (createSlider) {
        res.status(201).send("Slider and text Created Successful");
      }
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal Server Error" }); 
    }
  });

  app.get("/api/All-User", async (req, res) => {
    try {

      const getUsersQuery = "SELECT * FROM user";
      const users = await executeQuery(getUsersQuery);
  
      if (!users || users.length === 0) {
        throw { code: 404, message: "User not found" };
      }
  
      res.status(200).send({ code: 200, message: users });

    } catch (error) {
      res.status(error.code || 500).send({
        code: error.code || 500,
        message: error.message || "Internal Server Error",
      });
    }
  });

}