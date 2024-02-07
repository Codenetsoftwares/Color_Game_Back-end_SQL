import mongoose from "mongoose";

export const Admin = new mongoose.model("admin", new mongoose.Schema({
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    gameList: [
        {
          gameName: { type: String },
          currentTime: { type: String},
          Description : { type: String},
          markets: [
            {
              marketId: { type: mongoose.Schema.Types.ObjectId, unique: true },
              marketName: { type: String },
              participants : {type : Number},
              spendTime: { type: String},
              runners: [
                {
                  runnerId: { type: mongoose.Schema.Types.ObjectId, unique: true },
                  runnerName: { type: String },
                  rate :[{
                      Back: { type: Number} ,
                      Lay : { type: Number}
                  }]
                },
              ],
            },
          ],
        },
      ],
}), 'admin');
