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



  app.post("/api/create-games/:adminId", async (req, res) => {
    try {
     const adminId = req.params.adminId
     const {gameName  ,Description} = req.body
     const games = await AdminController.createGame(adminId, gameName  ,Description)
     res.status(200).send({ code: 200, message: "Game Create Successfully", games })

    } catch (err) {
      res.status(500).send({ code: err.code, message: err.message })
    }
  })

  app.post("/api/create-markets/:adminId/:gameName", async (req, res) => {
    try {
     const { adminId, gameName } = req.params;
     const { marketName , participants , timeSpan } = req.body
     const markets = await AdminController.createMarket(adminId, gameName ,marketName ,participants , timeSpan)
     res.status(200).send({ code: 200, message: "Market Create Successfully", markets })

    } catch (err) {
      res.status(500).send({ code: err.code, message: err.message })
    }
  })


  app.post("/api/create-runners/:adminId/:gameName/:marketName", async (req, res) => {
    try {
     const { adminId, gameName ,marketName } = req.params;
     const {runnerName } = req.body
     const runners = await AdminController.createRunner(adminId, gameName ,marketName, runnerName)
     res.status(200).send({ code: 200, message: "Runner Create Successfully", runners })

    } catch (err) {
      res.status(500).send({ code: err.code, message: err.message })
    }
  })

  app.post("/api/create-Rate/:adminId/:gameName/:marketName/:runnerName", async (req, res) => {
    try {
     const {adminId, gameName, marketName, runnerName,} = req.params;
     const {back , lay } = req.body
     const rates = await AdminController.createRate(adminId, gameName, marketName, runnerName, back, lay)
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
      const gameNames = admins.map(admin => admin.gameList.map(game => game.gameName));
      res.status(200).send(gameNames)
    } catch (error) {
      res.status(500).send({ code: error.code, message: error.message });
    }
  });
  app.get("/api/All-Markets",async(req,res)=>{
    try {
      const admins = await Admin.find()
      if (!admins) {
        throw {code: 404,  message: "Admin not found" };
    }
      const data = admins.map((dataList)=> dataList.gameList.map((game)=>game.markets.map((market)=>market.marketName)))
      res.status(200).send(data)
    } catch (error) {
      res.status(500).send({ code: error.code, message: error.message })
    }
  })



}