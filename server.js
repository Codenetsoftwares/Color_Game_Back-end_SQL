import mysql from 'mysql2';
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { AdminRoute } from './routes/admin.route.js';
import { UserRoute } from './routes/user.route.js';
import { GameRoute } from './routes/game.route.js';
import moment from 'moment';
import { SliderRoute } from './routes/slider.route.js';
import cors from 'cors';
import { AnnouncementRoute } from './routes/announcement.route.js';
import sequelize from './db.js';
import Game from './models/game.model.js';
import Market from './models/market.model.js';
import Runner from './models/runner.model.js';
import { authRoute } from './routes/auth.route.js';
import CurrentOrder from './models/currentOrder.model.js';
import BetHistory from './models/betHistory.model.js';
import MarketBalance from './models/marketBalance.js';
import { InactiveGameRoute } from './routes/inactiveGame.route.js';
import InactiveGame from './models/inactiveGame.model.js';
import { startMarketCountdown } from './cron/startMarketCountdown.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { Op } from "sequelize";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import cron from 'node-cron'
import { externalApisRoute } from './routes/externalApis.route.js';
import { checkAndManageIndexes } from './helper/indexManager.js';
import { lotteryRoute } from './routes/lotteryGame.route.js';
import { voidGameRoute } from './routes/voidGame.route.js';

dotenv.config();
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = process.env.FRONTEND_URI.split(',');
app.use(cors({ origin: allowedOrigins }));

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.log('Error to connecting Database: ' + err.message);
  } else {
    console.log('Database connection successfully');
    connection.release();
  }
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

AdminRoute(app);
authRoute(app);
UserRoute(app);
GameRoute(app);
AnnouncementRoute(app);
SliderRoute(app);
InactiveGameRoute(app);
externalApisRoute(app);
lotteryRoute(app)
voidGameRoute(app);

Game.hasMany(Market, { foreignKey: 'gameId', sourceKey: 'gameId' });
Market.belongsTo(Game, { foreignKey: 'gameId', targetKey: 'gameId' });

Market.hasMany(Runner, { foreignKey: 'marketId', sourceKey: 'marketId' });
Runner.belongsTo(Market, { foreignKey: 'marketId', targetKey: 'marketId' });

CurrentOrder.belongsTo(Market, { foreignKey: 'marketId', targetKey: 'marketId', as: 'market' });
BetHistory.belongsTo(Market, { foreignKey: 'marketId', targetKey: 'marketId', as: 'market' });

Market.hasMany(MarketBalance, { foreignKey: 'marketId', sourceKey: 'marketId' });
MarketBalance.belongsTo(Market, { foreignKey: 'marketId', targetKey: 'marketId' });

InactiveGame.belongsTo(Game, { foreignKey: 'gameId' });
Game.hasMany(InactiveGame, { foreignKey: 'gameId' });

InactiveGame.belongsTo(Market, { foreignKey: 'marketId' });
Market.hasMany(InactiveGame, { foreignKey: 'marketId' });

InactiveGame.belongsTo(Runner, { foreignKey: 'runnerId' });
Runner.hasMany(InactiveGame, { foreignKey: 'runnerId' });

checkAndManageIndexes('game'); 
checkAndManageIndexes('runner'); 
checkAndManageIndexes('market');

// SSE endpoint
const clients = [];
app.get('/events', (req, res) => {
  console.log("Client connected to events");

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.flushHeaders(); // Ensure headers are sent immediately

  // Add the connected client to the list
  clients.push(res);

  // Send an initial message
  const initialMessage = { message: "SSE service is connected successfully!" };
  res.write(`data: ${JSON.stringify(initialMessage)}\n\n`);

  // Handle client disconnection
  req.on('close', () => {
    console.log('Client disconnected');
    const index = clients.indexOf(res);
    if (index !== -1) {
      clients.splice(index, 1); // Remove the client from the list
    }
    res.end(); // End the response
  });
});


sequelize
  .sync({ alter: true })
  .then(() => {
    console.log('Database & tables created!');
    // startMarketCountdown()
    app.listen(process.env.PORT, () => {
      console.log(`App is running on  - http://localhost:${process.env.PORT || 7000}`);
    });

    cron.schedule('*/2 * * * * *', async () => {
      try {
        // const markets = await Market.findAll({
        //   where: {
        //     isActive: true,
        //     endTime: { [Op.lte]: moment().utc().format() }
        //   }
        // });
        let markets = []
        let updateMarket = []
        for (const market of markets) {

          market.isActive = false;
          const response = await market.save();

          console.log("Markets Inactivated:", JSON.stringify(response, null, 2));

          console.log(`Market ${response.marketName} has been deactivated.`);
          updateMarket.push(JSON.parse(JSON.stringify(response)))

        }

        clients.forEach((client) => {
          client.write(`data: ${JSON.stringify(updateMarket)}\n\n`);
        });
        console.log(`Message sent: ${JSON.stringify(updateMarket)}\n`);

      } catch (error) {
        console.error('Error checking market statuses:', error);
      }
    });

  })
  .catch((err) => {
    console.error('Unable to create tables:', err);
  });