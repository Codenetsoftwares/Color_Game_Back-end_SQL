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
     const { marketName , participants , timeSpan } = req.body
     const markets = await AdminController.createMarket( gameName ,marketName ,participants , timeSpan)
     res.status(200).send({ code: 200, message: "Market Create Successfully", markets })

    } catch (err) {
      res.status(500).send({ code: err.code, message: err.message })
    }
  })


  app.post("/api/create-runners/:gameName/:marketName", async (req, res) => {
    try {
     const {runnerName } = req.body
     const runners = await AdminController.createRunner( gameName ,marketName, runnerName)
     res.status(200).send({ code: 200, message: "Runner Create Successfully", runners })

    } catch (err) {
      res.status(500).send({ code: err.code, message: err.message })
    }
  })

  app.post("/api/create-Rate/:gameName/:marketName/:runnerName", async (req, res) => {
    try {
     const {gameName, marketName, runnerName,} = req.params;
     const {back , lay } = req.body
     const rates = await AdminController.createRate( gameName, marketName, runnerName, back, lay)
     res.status(200).send({ code: 200, message: "Rate Create Successfully", rates })

    } catch (err) {
      res.status(500).send({ code: err.code, message: err.message })
    }
  })


  app.get("/api/All-Games", async (req, res) => {
    try {
      const admins = await Admin.find();
      if (!admins || admins.length === 0) {
        throw { code: 404, message: 'Admin not found' };
      }
      const gameInfo = admins.map(admin =>
        admin.gameList.map(game => ({
          gameName: game.gameName,
          Description: game.Description,
        }))
      );
      const gameData = [].concat(...gameInfo);
      res.status(200).send(gameData);
    } catch (error) {
      res.status(500).send({ code: error.code, message: error.message });
    }
  });

app.get("/api/All-Markets", async (req, res) => {
  try {
    const admins = await Admin.find();

    if (!admins || admins.length === 0) {
      throw { code: 404, message: "Admin not found" };
    }

    const marketInfo = admins.map((admin) =>
      admin.gameList.map((game) =>
        game.markets.map((market) => market.marketName)
      )
    );

    const marketData = [].concat(...[].concat(...marketInfo));

    res.status(200).send(marketData);
  } catch (error) {
    res.status(500).send({ code: error.code, message: error.message });
  }
});

}