import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import { Admin } from "../models/admin.model.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";



export const AdminController = {
  createAdmin: async (data) => {
      try {
          if (!data.userName) {
              throw { message: "userName Is Required" };
          }
          if (!data.password) {
              throw { message: "Password Is Required" };
          }           
          const existingAdmin = await Admin.findOne({ userName: data.userName });
          if (existingAdmin) {
              throw { code: 409, message: "Admin Already Exists" };
          }
    
          const Passwordsalt = await bcrypt.genSalt();
          const encryptedPassword = await bcrypt.hash(data.password, Passwordsalt);
  
          const newAdmin = new Admin({
          userName: data.userName,
          password: encryptedPassword,
          
      });

      await newAdmin.save();
  } catch (err) {
      console.error(err);
      throw { code: 500, message: "Failed to save user" };
  }
},

  //create user
    
      GenerateAccessToken: async(userName,password) => {
      if (!userName) {
          throw { code: 400, message: 'Invalid userName' };
        }
        if (!password) {
          throw { code: 400, message: 'Invalid password' };
        }
        const existingUser = await Admin.findOne({ userName: userName });
        
        if (!existingUser) {
          throw { code: 400, message: 'Invalid userName or Password' };
        }
        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
      
        if (!isPasswordValid) {
          throw { code: 401, message: 'Invalid userName or Password' };
        }
        const accessTokenResponse = {
          id: existingUser._id,
          userName: existingUser.userName,
        };
        const accessToken = jwt.sign(accessTokenResponse, process.env.JWT_SECRET_KEY, {
          expiresIn: '1d',
        });
        return {
          userName: existingUser.userName,
          accessToken: accessToken,
        };
      }, 


      
      createUser: async(data)=>{
          try {
            if (!data.firstName) {
              throw { message: "firstName Is Required" };
            }
            if (!data.lastName) {
              throw { message: "lastName Is Required" };
            }
            if (!data.userName) {
              throw { message: "userName Is Required" };
          }
          if (!data.phoneNumber) {
            throw { message: "phoneNumber Is Required" };
          }
          if (!data.password) {
            throw { message: "Password Is Required" };
        }
        const existingUser = await User.findOne({ userName: data.userName });
                if (existingUser) {
                    throw { code: 409, message: "User Already Exists" };
                }
                const Passwordsalt = await bcrypt.genSalt();
                const encryptedPassword = await bcrypt.hash(data.password, Passwordsalt);
                const newUser = new User({
                  firstName:data.firstName,
                  lastName:data.lastName,
                  userName: data.userName,
                  phoneNumber:data.phoneNumber,
                  password: encryptedPassword,
            });
            await newUser.save();
          } catch (error) {
            console.log(error);
            throw { code: 500, message: "Failed to save user" };
          }
        },

      loginUser: async(userName,password) => {
          if (!userName) {
              throw { code: 400, message: 'Invalid userName' };
            }
            if (!password) {
              throw { code: 400, message: 'Invalid password' };
            }
            const existingUser = await User.findOne({ userName: userName });
            if (!existingUser) {
              throw { code: 400, message: 'Invalid userName or Password' };
            }
            const isPasswordValid = await bcrypt.compare(password, existingUser.password);
            if (!isPasswordValid) {
              throw { code: 401, message: 'Invalid userName or Password' };
            }
            const accessTokenResponse = {
              id: existingUser._id,
              userName: existingUser.userName,
            };
            const accessToken = jwt.sign(accessTokenResponse, process.env.JWT_SECRET_KEY, {
              expiresIn: '1d',
            });
            return {
              userName: existingUser.userName,
              accessToken: accessToken,
            };
          },
  

      createGame: async (adminId, gameName  ,Description) => {
          try {
              const admin = await Admin.findById(adminId);

              if(!admin) {
                throw { code: 404, message: "Admin Not Found"}
              }
      
              admin.gameList.push({
                  gameName: gameName,
                  Description : Description,
                  markets: []
              });
      
              await admin.save();
      
              return {
                  gameList: admin.gameList,
              };
          } catch (error) {
              throw error;
          }
      },
      
      
      createMarket: async (adminId, gameName, marketName , participants , timeSpan) => {
          try {
              const admin = await Admin.findById(adminId);
      
              if (!admin) {
                  throw {code: 404,  message: "Admin not found" };
              }
      
              const game = admin.gameList.find(game => game.gameName.toLowerCase() === gameName.toLowerCase());
      
              if (!game) {
                  throw { message: "Game not found" };
              }
      
              const newMarket = {
                  marketId: new mongoose.Types.ObjectId(),
                  marketName: marketName,
                  participants : participants,
                  timeSpan : timeSpan,
                  runners: [],
              };
      
              game.markets.push(newMarket);
      
              await admin.save();
      
              return {
                  gameList: admin.gameList,
              };
          } catch (error) {
              throw error;
          }
      },
      
      
      createRunner: async (adminId, gameName, marketName, runnerName) => {
          try {
            const admin = await Admin.findById(adminId);
      
            if (!admin) {
              throw {code: 404, message: "Admin not found" };
            }
      
            const game = admin.gameList.find(
              (game) => game.gameName.toLowerCase() === gameName.toLowerCase()
            );
      
            if (!game) {
              throw { message: "Game not found" };
            }
      
            const market = game.markets.find(
              (market) => market.marketName.toLowerCase() === marketName.toLowerCase()
            );
      
            if (!market) {
              throw { message: "Market not found" };
            }
      
            const newRunner = {
              runnerId: new mongoose.Types.ObjectId(),
              runnerName: runnerName,
              rate: {
                Back: 0, 
                Lay: 0, 
              },
            };
      
            market.runners.push(newRunner);
      
            await admin.save();
      
            return {
              gameList: admin.gameList,
            };
          } catch (error) {
            throw error;
          }
        },

        createRate: async (adminId, gameName, marketName, runnerName, back, lay) => {
          try {
              const admin = await Admin.findById(adminId);
      
              if (!admin) {
                  throw { code: 404, message: "Admin not found" };
              }
      
              const game = admin.gameList.find(
                  (game) => game.gameName.toLowerCase() === gameName.toLowerCase()
              );
      
              if (!game) {
                  throw { message: "Game not found" };
              }
      
              const market = game.markets.find(
                  (market) => market.marketName.toLowerCase() === marketName.toLowerCase()
              );
      
              if (!market) {
                  throw { message: "Market not found" };
              }
      
              const runnerToUpdate = market.runners.find(
                  (runner) => runner.runnerName.toLowerCase() === runnerName.toLowerCase()
              );
      
              if (runnerToUpdate) {                   
                  runnerToUpdate.rate[0].Back = back;
                  runnerToUpdate.rate[0].Lay = lay;
      
                  await admin.save();
      
                  return {
                      gameList: admin.gameList,
                  };
              } else {
                  throw { message: "Runner not found" };
              }
          } catch (error) {
              throw error;
          }
      },
      
      
      }

  