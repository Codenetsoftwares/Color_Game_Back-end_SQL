import { log } from "console";
import { AdminController } from "../controller/admin.controller.js";
import { Admin } from "../models/admin.model.js";
import { User } from "../models/user.model.js";



export const AdminRoute = (app) => {

    app.post("/api/admin-create",
    async (req, res) => {
        try {
            const user = req.user;
            await AdminController.createAdmin(req.body, user);
            res.status(200).send({ code: 200, message: 'Admin registered successfully!' })
        }
        catch (err) {
            res.status(500).send({ code: err.code, message: err.message })
        }
    });

  app.post("/api/admin-login", async (req, res) => {
    try {
      const { userName, password } = req.body;
      const admin = await Admin.findOne({ userName: userName });
      const accesstoken = await AdminController.GenerateAccessToken(userName, password);
      if (admin && accesstoken) {
        res.status(200).send({ code: 200, message: "Login Successfully", token: accesstoken });
      } else {
        res.status(404).json({ code: 404, message: 'Invalid Access Token or User' });
      }
    }
    catch (err) {
      res.status(500).send({ code: err.code, message: err.message })
    }
  })


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
    const { userName, password } = req.body;
    const user = await User.findOne({ userName: userName });
    const accesstoken = await AdminController.loginUser(userName, password);
    if (user && accesstoken) {
      res.status(200).send({ code: 200, message: "Login Successfully", token: accesstoken });
    } else {
      res.status(404).json({ code: 404, message: 'Invalid Access Token or User' });
    }
  }
  catch (error) {
    res.status(500).send({ code: error.code, message: error.message })
  }
})



  app.post("/api/create-games", async (req, res) => {
    try {    
     const {gameName  ,Description} = req.body
     const games = await AdminController.createGame( gameName  ,Description)
     res.status(200).send({ code: 200, message: "Game Create Successfully", games })

    } catch (err) {
      res.status(500).send({ code: err.code, message: err.message })
    }
  })

  app.post("/api/create-markets/:gameName", async (req, res) => {
    try {
      const {gameName} = req.params;
     const { marketName , participants , timeSpan } = req.body
     const markets = await AdminController.createMarket( gameName ,marketName ,participants , timeSpan)
     res.status(200).send({ code: 200, message: "Market Create Successfully", markets })

    } catch (err) {
      res.status(500).send({ code: err.code, message: err.message })
    }
  })


  app.post("/api/create-runners/:gameName/:marketName", async (req, res) => {
    try {
      const {gameName, marketName} = req.params;
     const {runnerNames } = req.body
     const runners = await AdminController.createRunner( gameName ,marketName, runnerNames)
     res.status(200).send({ code: 200, message: "Runner Create Successfully", runners })

    } catch (err) {
      res.status(500).send({ code: err.code, message: err.message })
    }
  })

  app.post("/api/create-Rate/:gameName/:marketName/:runnerNames", async (req, res) => {
    try {
     const {gameName, marketName, runnerNames,} = req.params;
     const {back , lay } = req.body
     const rates = await AdminController.createRate( gameName, marketName, runnerNames, back, lay)
     res.status(200).send({ code: 200, message: "Rate Create Successfully", rates })

    } catch (err) {
      res.status(500).send({ code: err.code, message: err.message })
    }
  })

  app.get("/api/All-Games", async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
      const searchQuery = req.query.search || '';

      const admins = await Admin.find();
  
      if (!admins || admins.length === 0) {
        throw { code: 404, message: "Admin not found" };
      }
  
      const gameData = admins.flatMap((admin) =>
        admin.gameList.map((game) => ({
          gameName: game.gameName,
          Description: game.Description,
        }))
      );
  
      const filteredGameData = gameData.filter(game =>
        game.gameName.toLowerCase().includes(searchQuery.toLowerCase())
      );
  
      const totalItems = filteredGameData.length;
  
      let paginatedGameData;
      let totalPages = 1;
  
      if (page && pageSize) {
        totalPages = Math.ceil(totalItems / pageSize);
        paginatedGameData = filteredGameData.slice(
          (page - 1) * pageSize,
          page * pageSize
        );
      } else {
        paginatedGameData = filteredGameData;
      }
  
      res.status(200).send({
        games: paginatedGameData,
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
  
  
  
  
  
  app.get("/api/All-Markets", async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
      const searchQuery = req.query.search || '';
  
      const admins = await Admin.find();
  
      if (!admins || admins.length === 0) {
        throw { code: 404, message: "Admin not found" };
      }
  
      const marketInfo = admins.flatMap((admin) =>
        admin.gameList.flatMap((game) =>
          game.markets.filter((market) =>
            market.marketName.toLowerCase().includes(searchQuery.toLowerCase())
          )
        )
      );
  
      const marketData = [].concat(...marketInfo);
  
      let paginatedMarketData;
      let totalPages = 1;
  
      if (page && pageSize) {
        const totalItems = marketData.length;
        totalPages = Math.ceil(totalItems / pageSize);
  
        paginatedMarketData = marketData.slice(
          (page - 1) * pageSize,
          page * pageSize
        );
      } else {
        paginatedMarketData = marketData;
      }
  
      const marketNames = paginatedMarketData.map((market) => market.marketName);
  
      res.status(200).send({
        markets: marketNames,
        currentPage: page,
        totalPages: totalPages,
        totalItems: marketData.length,
      });
    } catch (error) {
      res.status(500).send({
        code: error.code || 500,
        message: error.message || "Internal Server Error",
      });
    }
  });
  
  
  
  

  app.get("/api/All-Runners", async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
      const searchQuery = req.query.search || '';
  
      const admins = await Admin.find();
  
      if (!admins || admins.length === 0) {
        throw { code: 404, message: "Admin not found" };
      }
  
      const runnerNames = admins.flatMap((admin) =>
        admin.gameList.flatMap((game) =>
          game.markets.flatMap((market) =>
            market.runners.filter((runner) =>
              runner.runnerName.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
          )
        )
      );
  
      const totalItems = runnerNames.length;
      let paginatedRunnerNames;
      let totalPages = 1;
  
      if (page && pageSize) {
        totalPages = Math.ceil(totalItems / pageSize);
  
        paginatedRunnerNames = runnerNames.slice(
          (page - 1) * pageSize,
          page * pageSize
        );
      } else {
        paginatedRunnerNames = runnerNames;
      }
  
      const runnerNamesList = paginatedRunnerNames.map((runner) => runner.runnerName.name);
  
      res.status(200).send({
        runners: runnerNamesList,
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
  
  







}