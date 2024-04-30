import { database } from '../controller/database.controller.js'
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { apiResponseErr, apiResponseSuccess, apiResponsePagination } from '../middleware/serverError.js';

dotenv.config();
// done
export const createAdmin = async (req, res) => {
  const { userName, password, roles } = req.body;
  try {
    const existingAdminQuery = 'SELECT * FROM Admin WHERE userName = ?';
    const [existingAdmin] = await database.execute(existingAdminQuery, [userName]);

    if (existingAdmin.length > 0) {
      throw new Error('Admin already exists');
    }

    const saltRounds = 10;
    const encryptedPassword = await bcrypt.hash(password, saltRounds);

    const adminId = uuidv4();

    const insertAdminQuery = 'INSERT INTO Admin (adminId, userName, password, roles) VALUES (?, ?, ?, ?)';
    const [result] = await database.execute(insertAdminQuery, [adminId, userName, encryptedPassword, JSON.stringify(roles)]);

    const newAdmin = {
      id: result.insertId,
      userName,
      password: encryptedPassword,
      roles
    };
    return res.status(201).json(apiResponseSuccess(newAdmin, 201, true, 'Admin created successfully'));

  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// done
export const generateAccessToken = async (req, res) => {
  const { userName, password } = req.body;
  try {
    const existingAdminQuery = 'SELECT * FROM Admin WHERE userName = ?';
    const [existingAdmin] = await database.execute(existingAdminQuery, [userName]);

    if (existingAdmin.length === 0) {
      return apiResponseErr(null, false, 400, 'Admin Does Not Exist');
    }

    const admin = existingAdmin[0];

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return apiResponseErr(null, false, 400, 'Invalid username or password');
    }

    const accessTokenResponse = {
      id: admin.id,
      userName: admin.userName,
      UserType: admin.userType || 'Admin',
    };

    const accessToken = jwt.sign(accessTokenResponse, process.env.JWT_SECRET_KEY, {
      expiresIn: '1d',
    });

    return res.status(200).send(apiResponseSuccess({ accessToken, userName: admin.userName, UserType: admin.userType || 'Admin' },
      true,
      200,
      'Admin login successfully',
    ));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// done
export const createUser = async (req, res) => {
  const { firstName, lastName, userName, phoneNumber, password } = req.body;
  try {
    const existingUserQuery = 'SELECT * FROM User WHERE userName = ?';
    const [existingUser] = await database.execute(existingUserQuery, [userName]);

    if (existingUser.length > 0) {
      return res.status(400).send(apiResponseErr(existingUser, false, 400, 'User already exists'));
    }

    const passwordSalt = await bcrypt.genSalt();
    const encryptedPassword = await bcrypt.hash(password, passwordSalt);

    const insertUserQuery = `
          INSERT INTO User (firstName, lastName, userName, phoneNumber, password, roles)
          VALUES (?, ?, ?, ?, ?, ?)
      `;
    await database.execute(insertUserQuery, [firstName, lastName, userName, phoneNumber, encryptedPassword, 'User']);

    return res.status(201).send(apiResponseSuccess(existingUser, true, 201, 'User created successfully'));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// done
export const checkMarketStatus = async (req, res) => {
  const marketId = req.params.marketId;
  const { status } = req.body;

  try {
    const [market] = await database.execute('SELECT * FROM Market WHERE marketId = ?', [marketId]);

    if (!market) {
      return res.status(404).json(apiResponseErr(null, false, 404, 'Market not found.'));
    }

    const updateMarketQuery = 'UPDATE Market SET isActive = ? WHERE marketId = ?';
    await database.execute(updateMarketQuery, [status, marketId]);

    const statusMessage = status ? 'Market is active.' : 'Market is suspended.';
    res.status(200).send(apiResponseSuccess(statusMessage, true, 200, 'success'));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// done
export const getAllUsers = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
    const searchQuery = req.query.search ? req.query.search.toLowerCase() : '';

    const countQuery = `SELECT COUNT(*) AS total FROM User WHERE LOWER(userName) LIKE '%${searchQuery}%'`;
    const [countResult] = await database.execute(countQuery);
    const totalItems = countResult[0].total;

    const totalPages = Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;

    const getUsersQuery = `SELECT * FROM User WHERE LOWER(userName) LIKE '%${searchQuery}%' LIMIT ${offset}, ${pageSize}`;
    const [users] = await database.execute(getUsersQuery);

    if (!users || users.length === 0) {
      throw apiResponseErr(null, false, 400, 'User not found');
    }

    const paginationData = apiResponsePagination(page, totalPages, totalItems);
    return res.status(200).send(apiResponseSuccess(users, true, 200, paginationData));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// done
export const deposit = async (req, res) => {
  try {
    const { adminId, depositAmount } = req.body;
    const existingAdminQuery = 'SELECT * FROM Admin WHERE adminId = ?';
    const [existingAdmin] = await database.execute(existingAdminQuery, [adminId]);

    if (!existingAdmin) {
      return res.status(404).json(apiResponseErr(null, false, 404, 'Admin Not Found'));
    }

    const parsedDepositAmount = parseFloat(depositAmount);

    const updateAdminQuery = 'UPDATE Admin SET balance = COALESCE(balance, 0) + ?, walletId = ? WHERE adminId = ?';
    const walletId = uuidv4();
    await database.execute(updateAdminQuery, [parsedDepositAmount, walletId, adminId]);

    const updatedAdminQuery = 'SELECT * FROM Admin WHERE adminId = ?';
    const [updatedAdmin] = await database.execute(updatedAdminQuery, [adminId]);
    const newAdmin = {
      adminId,
      walletId,
      balance: updatedAdmin[0].balance
    };
    return res.status(201).json(apiResponseSuccess(newAdmin, true, 201, 'Deposit balance successful'));
  } catch (error) {
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// done
export const sendBalance = async (req, res) => {
  try {
    const { balance, adminId, userId } = req.body;
    const adminQuery = 'SELECT * FROM Admin WHERE adminId = ?';
    const [admin] = await database.execute(adminQuery, [adminId]);
    if (!admin.length) {
      return res.status(400).json(apiResponseErr(null, false, 400, 'Admin Not Found'));
    }

    const userQuery = 'SELECT * FROM User WHERE id = ?';
    const [user] = await database.execute(userQuery, [userId]);
    if (!user.length) {
      return res.status(400).json(apiResponseErr(null, false, 400, 'User Not Found'));
    }

    if (isNaN(balance)) {
      return res.status(400).json(apiResponseErr(null, false, 400, 'Invalid Balance'));
    }

    const parsedDepositAmount = parseFloat(balance);

    if (admin[0].balance < parsedDepositAmount) {
      return res.status(400).json(apiResponseErr(null, false, 400, 'Insufficient Balance For Transfer'));
    }

    const updateAdminBalanceQuery = 'UPDATE Admin SET balance = balance - ? WHERE adminId = ?';
    await database.execute(updateAdminBalanceQuery, [parsedDepositAmount, adminId]);

    const updateUserBalanceQuery = 'UPDATE User SET balance = balance + ? WHERE id = ?';
    await database.execute(updateUserBalanceQuery, [parsedDepositAmount, userId]);

    const newUserWalletId = uuidv4();
    const updateUserWalletIdQuery = 'UPDATE User SET walletId = ? WHERE id = ?';
    await database.execute(updateUserWalletIdQuery, [newUserWalletId, userId]);

    const transactionRecordQuery = `
      INSERT INTO TransactionRecord (userId, transactionType, amount, date)
      VALUES (?, 'Credit', ?, ?)
    `;
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await database.execute(transactionRecordQuery, [userId, parsedDepositAmount, currentDate]);

    const successResponse = {
      userId,
      balance: user[0].balance ,
      walletId: newUserWalletId,
    };
    return res.status(201).json(apiResponseSuccess(successResponse, true, 201, 'Send balance to User successful'));
  } catch (error) {
    console.error('Error sending balance:', error);
    res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};


export const afterWining = async (req, res) => {
  const { runnerId, marketId, isWin } = req.body
  try {
    const adminDoc = await Admin.findOne({ 'gameList.markets.runners.runnerName.runnerId': runnerId });
    if (!adminDoc) return res.status(400).json(apiResponseErr(null, false, 400, 'Runner not found'));

    for (const game of adminDoc.gameList) {
      for (const market of game.markets) {
        if (String(market.marketId) === marketId) {
          market.runners.forEach(runner => {
            if (String(runner.runnerName.runnerId) === String(runnerId)) {
              runner.runnerName.isWin = isWin;
            } else {
              runner.runnerName.isWin = false;
            }
          });
          if (isWin) {
            market.announcementResult = true;
          }
        }
      }
    }

    const users = await User.find({ "marketBalance.marketId": marketId });
    for (const user of users) {
      const marketBalance = user.marketBalance.find(item => String(item.marketId) === marketId);
      if (marketBalance) {
        const runnerBalance = marketBalance.runnerBalance.find(item => String(item.runnerId) === runnerId);
        if (runnerBalance) {
          const marketExposure = user.wallet.marketListExposure.find(item => Object.keys(item)[0] === marketId);
          if (marketExposure) {
            const marketExposureValue = Number(marketExposure[marketId]);
            if (isWin) {
              user.wallet.balance += runnerBalance.bal + marketExposureValue;
            } else {
              runnerBalance.bal -= marketExposureValue;
              user.wallet.balance += runnerBalance.bal;
            }

            const marketIndex = user.wallet.marketListExposure.findIndex(item => Object.keys(item)[0] === marketId);
            if (marketIndex !== -1) {
              user.wallet.marketListExposure.splice(marketIndex, 1);
            }

            await user.save();
          }
        }
      }
    }

    if (isWin) {
      const market = adminDoc.gameList.flatMap(game => game.markets).find(m => String(m.marketId) === marketId);
      if (market && market.announcementResult) {
        const orders = await currentOrder.find({ "orders.marketId": marketId });
        for (const doc of orders) {
          for (const orderItem of doc.orders) {
            const betHistoryEntry = {
              userId: orderItem.userId,
              gameId: orderItem.gameId,
              gameName: orderItem.gameName,
              marketId: orderItem.marketId,
              marketName: orderItem.marketName,
              runnerId: orderItem.runnerId,
              runnerName: orderItem.runnerName,
              rate: orderItem.rate,
              value: orderItem.value,
              type: orderItem.type,
              date: new Date(),
              bidAmount: orderItem.bidAmount,
              isWin: orderItem.isWin,
              profitLoss: orderItem.profitLoss,
            };
            await betHistory.insertMany({ orders: [betHistoryEntry] });
          }
        }
        await currentOrder.deleteMany({ "orders.marketId": marketId });
      }
    }
    await adminDoc.save();

    return res.status(200).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json(apiResponseErr(null, false, 500, error.message));
  }
};
export const userUpdate = async (req, res) => {
  const { userId } = req.params;
  const { firstName, lastName, userName, phoneNumber, password, balance } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).send(apiResponseErr(null, false, 400, 'User Not Found'));
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (userName) user.userName = userName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (password) {
      const passwordSalt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(password, passwordSalt);
    }
    if (balance) user.wallet.balance = balance;

    const updateUser = await user.save();
    res.status(200).send(apiResponseSuccess(updateUser, true, 200, 'User updated successfully'));
  } catch (error) {

    res.status(500).send(apiResponseErr(null, false, 500, error.message));
  }
};

export const deleteGame = async (req, res) => {
  const gameId = req.params.gameId;
  try {
    const admin = await Admin.findOne();
    const game = admin.gameList.find(game => String(game.gameId) === gameId);

    if (!game) {
      return res.status(400).send(apiResponseErr(null, false, 400, 'Game Not Found'));
    }
    admin.gameList = admin.gameList.filter(game => String(game.gameId) !== gameId);
    const deleteGame = await admin.save();
    res.status(200).send(apiResponseSuccess(deleteGame, true, 200, 'Game deleted successfully'));
  } catch (error) {
    res.status(500).send(apiResponseErr(null, false, 500, error.message));
  }
};

export const deleteMarket = async (req, res) => {
  const { marketId } = req.params;

  try {
    const admin = await Admin.findOne({ 'gameList.markets.marketId': marketId });

    if (!admin) {
      return res.status(400).send(apiResponseErr(null, false, 400, 'Admin Not Found'));
    }

    let marketIndex = -1;
    admin.gameList.forEach((game, index) => {
      game.markets.forEach(market => {
        if (market.marketId && market.marketId.toString() === marketId.toString()) {
          marketIndex = index;
        }
      });
    });

    if (marketIndex === -1) {
      return res.status(400).send(apiResponseErr(null, false, 400, 'Market Not Found'));
    }

    admin.gameList[marketIndex].markets = admin.gameList[marketIndex].markets.filter(market => market.marketId.toString() !== marketId.toString());

    const deleteMarket = await admin.save();

    res.status(200).send(apiResponseSuccess(deleteMarket, true, 200, 'Market deleted successfully'));
  } catch (error) {
    res.status(500).send(apiResponseErr(null, false, 500, error.message));
  }
};

export const deleteRunner = async (req, res) => {
  const runnerId = req.params.runnerId;
  try {
    const runnerObj = await Admin.findOneAndUpdate(
      { 'gameList.markets.runners.runnerName.runnerId': runnerId },
      {
        $pull: {
          'gameList.$[game].markets.$[market].runners': { 'runnerName.runnerId': runnerId }
        },
      },
      {
        new: true,
        arrayFilters: [
          { 'game.gameId': { $exists: true } },
          { 'market.marketId': { $exists: true } }
        ],
      },
    );
    if (!runnerObj) {
      throw apiResponseErr(null, false, 400, `Runner not found`);
    }

    return res
      .status(200)
      .send(apiResponseSuccess({ gameList: runnerObj.gameList }, true, 200, 'Runner deleted successfully'));
  } catch (error) {
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};

