import { AdminController } from "../controller/admin.controller.js";
import { Authorize } from "../middleware/auth.js";

import mysql from "mysql2"
import dotenv from "dotenv";

import uuid from 'uuid';

  const uuidv4 = uuid.v4;
  

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



  app.post("/api/user-create",async(req,res)=>{
    try {
      const user =req.body;
      await AdminController.createUser(req.body,user)
      res.status(200).send({ code: 200, message: 'User registered successfully!' })
    } catch (error) {
      res.status(500).send({ code: error.code, message: error.message })
    }
  })

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


app.post("/api/create-games",
  Authorize(["superAdmin"]), 
  async (req, res) => {
    try {    
     const { gameName, Description } = req.body;
     const result = await AdminController.createGame(gameName, Description);
     const games = result.gameList; 
     res.status(200).send({ code: 200, message: "Game Create Successfully", games });
    } catch (err) {
      res.status(500).send({ code: err.code, message: err.message });
    }
  });

  app.post("/api/create-markets/:gameId", async (req, res) => {
    try {
      const { gameId } = req.params;
      const { marketName, participants, timeSpan } = req.body;
  
      const markets = await AdminController.createMarket(gameId, marketName, participants, timeSpan);
  
      res.status(200).send({ code: 200, message: "Market created successfully", markets });
    } catch (err) {
      res.status(500).send({ code: err.code, message: err.message });
    }
  });
  
  
  
  app.post("/api/create-runners/:gameId/:marketId", async (req, res) => {
    try {
        const { gameId, marketId } = req.params;
        const { runnerNames } = req.body;
        const runners = await AdminController.createRunner(gameId, marketId, runnerNames);
        res.status(200).send({ code: 200, message: "Runner Create Successfully", runners });
    } catch (err) {
        res.status(500).send({ code: err.code, message: err.message });
    }
});

app.post("/api/create-rate/:gameId/:marketId/:runnerId", async (req, res) => {
  try {
      const { gameId, marketId, runnerId } = req.params;
      const { back, lay } = req.body;

      const rates = await AdminController.createRate(gameId, marketId, runnerId, back, lay);

      res.status(200).send({ code: 200, message: "Rate created successfully", rates });
  } catch (err) {
      res.status(500).send({ code: err.code || 500, message: err.message || "Internal Server Error" });
  }
});

  app.get("/api/All-Games", async (req, res) => {
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
          WHERE JSON_UNQUOTE(JSON_EXTRACT(A.roles, '$[0]')) = 'superAdmin'
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
  

 app.get("/api/All-Markets/:gameId", async (req, res) => {
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




app.get("/api/All-Runners/:marketId", async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const searchQuery = req.query.search || '';

      const getRunnersQuery = `
          SELECT R.name, R.rateBack, R.rateLay
          FROM Runner R
          JOIN Market M ON R.marketId = M.marketId
          WHERE M.marketId = ? AND R.name LIKE ?
      `;

      const runners = await executeQuery(getRunnersQuery, [req.params.marketId, `%${searchQuery}%`]);

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
      });
  } catch (error) {
      res.status(500).send({
          code: error.code || 500,
          message: error.message || "Internal Server Error",
      });
  }
});

  
app.post("/api/update-market-status/:marketId", async (req, res) => {
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







}