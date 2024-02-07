import mongoose from "mongoose";
export const User = new mongoose.model("user", new mongoose.Schema({
    firstName:{type:String,required:true},
    lastName:{type:String,required:true},
    userName:  { type: String, required: true },
    phoneNumber:{type:Number,required:true},
    password:   { type: String, required: true },
    roles: [{ type: String, required: true, default: 'User'}],
}), 'user');