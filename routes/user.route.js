
import { UserController } from "../controller/user.controller.js";

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
        console.error("SQL Error:", err); 
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



export const UserRoute = (app) => {


  app.get("/api/user-games", async (req, res) => {
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

  
  app.get("/api/user-markets/:gameId", async (req, res) => {
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



  app.get("/api/user-runners/:marketId", async (req, res) => {
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
  
  app.post("/api/eligibilityCheck/:userId", async (req, res) => {
    try {    
     const { userId} = req.params
     const {eligibilityCheck}=req.body
     const check = await UserController.eligibilityCheck(userId,eligibilityCheck)
     res.status(200).send({ code: 200, message: "ok", check })

    } catch (err) {
      res.status(500).send({ code: err.code, message: err.message })
    }
  })

  app.get("/api/User-Details", async (req, res) => {
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