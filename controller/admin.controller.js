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
          roles: data.roles,
          
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
  

      createGame: async (gameName  ,Description) => {
          try {
              const admin = await Admin.findOne({roles : "Admin"});

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
      
      
      createMarket: async (gameName, marketName , participants , timeSpan) => {
          try {
            const admin = await Admin.findOne({roles : "Admin"});

              if (!admin) {
                  throw {code: 404,  message: "Admin not found" };
              }
      
              const game = admin.gameList.find(game => game.gameName === gameName);
      
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
      
      
      createRunner: async (gameName, marketName, runnerNames) => {
        try {
          const admin = await Admin.findOne({ roles: "Admin" });
      
          if (!admin) {
            throw { code: 404, message: "Admin not found" };
          }
      
          const game = admin.gameList.find((game) => game.gameName === gameName);
      
          if (!game) {
            throw { message: "Game not found" };
          }
      
          const market = game.markets.find((market) => market.marketName === marketName);
      
          if (!market) {
            throw { message: "Market not found" };
          }
      
          const maxParticipants = market.participants;
      
          if (runnerNames.length > maxParticipants) {
            throw { message: "Number of runners exceeds the maximum allowed participants." };
          }
      
          const newRunners = runnerNames.map((runnerName) => {
            const runnerId = new mongoose.Types.ObjectId();
            const name = runnerName;
            return {
              runnerName: { runnerId, name },
              rate: {
                Back: 0,
                Lay: 0,
              },
            };
          });
      
          market.runners.push(...newRunners);
      
          await admin.save();
      
          return {
            gameList: admin.gameList,
          };
        } catch (error) {
          throw error;
        }
      },
      

      createRate: async (gameName, marketName, runnerName, back, lay) => {
        try {
          const admin = await Admin.findOne({ roles: "Admin" });
      
          if (!admin) {
            throw { code: 404, message: "Admin not found" };
          }
      
          const game = admin.gameList.find((game) => game.gameName === gameName);
      
          if (!game) {
            throw { message: "Game not found" };
          }
      
          const market = game.markets.find((market) => market.marketName === marketName);
      
          if (!market) {
            throw { message: "Market not found" };
          }
      
          const runnerToUpdate = market.runners.find((runner) => runner.runnerName.name === runnerName);
      
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
      

      checkMarketStatus: async (marketId, status) => {
        try {
            if (typeof status !== 'boolean') {
                throw new Error("Invalid status format. It should be a boolean.");
            }
    
            const admin = await Admin.findOne({ "gameList.markets.marketId": marketId });
    
            if (!admin) {
                throw new Error("Market not found.");
            }
    
            let currentStatus;
    
            admin.gameList.forEach(game => {
                game.markets.forEach(market => {
                    if (market.marketId.equals(marketId)) {
                        market.status = status;
                        currentStatus = market.status;
                    }
                });
            });
    
            await admin.save();
    
            const statusMessage = currentStatus ? "Market is active." : "Market is suspended.";
    
            return {  currentStatus: statusMessage };
        } catch (error) {
            throw error;
        }
    }
    
      }

  