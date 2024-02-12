import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv"
import bodyParser from 'body-parser';
import { AdminRoute } from "./routes/admin.route.js";


import cors from 'cors';
import { UserRoute } from "./routes/user.route.js";


dotenv.config()

const app = express();

app.use(express.json());

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.urlencoded({ extended: true }));
const  allowedOrigins = process.env.FRONTEND_URI.split(",");
app.use(cors({ origin: allowedOrigins }));


mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_NAME });

AdminRoute(app);
UserRoute(app)



app.listen(process.env.PORT, ()=>{
    console.log(`App is running on  - http://localhost:${process.env.PORT || 8080}`)
})