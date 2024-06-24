import mysql from 'mysql2';
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { AdminRoute } from './routes/admin.route.js';
import { UserRoute } from './routes/user.route.js';
import { GameRoute } from './routes/game.route.js';
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

dotenv.config();
const app = express();
app.use(express.json({ limit: '100mb' }));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
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
Game.hasMany(Market, { foreignKey: 'gameId', sourceKey: 'gameId' });
Market.belongsTo(Game, { foreignKey: 'gameId', targetKey: 'gameId' });

Market.hasMany(Runner, { foreignKey: 'marketId', sourceKey: 'marketId' });
Runner.belongsTo(Market, { foreignKey: 'marketId', targetKey: 'marketId' });

CurrentOrder.belongsTo(Market, { foreignKey: 'marketId', targetKey: 'marketId', as: 'market' });
BetHistory.belongsTo(Market, { foreignKey: 'marketId', targetKey: 'marketId', as: 'market' });


sequelize
  .sync({ alter: true })
  .then(() => {
    console.log('Database & tables created!');
    app.listen(process.env.PORT, () => {
      console.log(`App is running on  - http://localhost:${process.env.PORT || 8080}`);
    });
  })
  .catch((err) => {
    console.error('Unable to create tables:', err);
  });
