
import { AdminController } from "../controller/admin.controller.js";
import { Admin } from "../models/admin.model.js";
import { User } from "../models/user.model.js";



export const UserRoute = (app) => {


  app.get("/api/user-games", async (req, res) => {
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
        game.gameName && game.gameName.toLowerCase().includes(searchQuery.toLowerCase())
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

  
  app.get("/api/user-markets/:gameName", async (req, res) => {
    try {
      const gameName = req.params.gameName;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const searchQuery = req.query.search || '';
  
      const admins = await Admin.findOne(
        { "gameList.gameName": gameName },
        { _id: 0, gameList: { $elemMatch: { gameName: gameName } } }
      ).exec();
  
      if (!admins || !admins.gameList || !Array.isArray(admins.gameList)) {
        throw { code: 404, message: "Admin not found" };
      }
  
      const marketDetails = admins.gameList.flatMap((game) =>
        game.markets.filter((market) =>
          market.marketName.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(market => ({
          marketName: market.marketName,
          timeSpan: market.timeSpan,
          participants: market.participants,
        }))
      );
  
      const marketData = [].concat(...marketDetails);
  
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
  
      res.status(200).send({
        markets: paginatedMarketData,
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



  app.get("/api/user-runners/:marketName", async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const searchQuery = req.query.search || '';
  
      const admins = await Admin.find();
  
      if (!admins || admins.length === 0) {
        throw { code: 404, message: "Admin not found" };
      }
  
      const runnerNames = admins.flatMap((admin) =>
        admin.gameList.flatMap((game) =>
          game.markets
            .filter((market) => market.marketName === req.params.marketName)
            .flatMap((market) =>
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
  
      const runnerNamesList = paginatedRunnerNames.map((runner) =>
      {
        return{ 
          runnerName : runner.runnerName.name,
          rates: runner.rate.map((rate)=>{
          return{ 
            Back: rate.Back,
            Lay: rate.Lay        
          }
        })}
      });
  
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