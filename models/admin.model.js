import mongoose from "mongoose";

export const Admin = new mongoose.model("admin", new mongoose.Schema({
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    roles: [{ type: String, required: true, default: 'Admin'}],
    gameList: [
        {
          gameName: { type: String },         
          Description : { type: String},
          markets: [
            {
              marketId: { type: mongoose.Schema.Types.ObjectId, unique: true },
              marketName: { type: String },
              participants : {type : Number},
              timeSpan: { type: String},
              status: { type: Boolean , default: false},
              runners: [{
                runnerName: {
                  runnerId: { type: mongoose.Schema.Types.ObjectId, unique: true },
                  name: { type: String, unique: true },
                },
                rate: [{
                  Back: { type: Number },
                  Lay: { type: Number }
                }],
              }],
            },
          ],
        },
      ],
}), 'admin');
