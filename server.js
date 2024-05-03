// server.js
import mysql from "mysql2";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { AdminRoute } from "./routes/admin.route.js";
import { UserRoute } from "./routes/user.route.js";
import { GameRoute } from "./routes/game.route.js";
import { SliderRoute } from "./routes/slider.route.js";
import cors from "cors";
import { AnnouncementRoute } from "./routes/announcement.route.js";

dotenv.config();
const app = express();

app.use(bodyParser.json());

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
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
UserRoute(app);
GameRoute(app);
AnnouncementRoute(app);

app.listen(8080, () => {
  console.log('App is running on - http://localhost:8080');
});
