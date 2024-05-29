import { database } from '../controller/database.controller.js';
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

    if (existingAdmin.length > 0) apiResponseErr(null, 400, false, 'Admin already exists');

    const saltRounds = 10;
    const encryptedPassword = await bcrypt.hash(password, saltRounds);

    const adminId = uuidv4();

    const insertAdminQuery = 'INSERT INTO Admin (adminId, userName, password, roles) VALUES (?, ?, ?, ?)';
    const [result] = await database.execute(insertAdminQuery, [
      adminId,
      userName,
      encryptedPassword,
      JSON.stringify(roles),
    ]);

    const newAdmin = {
      id: result.insertId,
      userName,
      password: encryptedPassword,
      roles,
    };
    return res.status(201).json(apiResponseSuccess(newAdmin, 201, true, 'Admin created successfully'));
  } catch (error) {
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// done
export const generateAccessToken = async (req, res) => {
  const { userName, password } = req.body;
  try {
    const existingAdminQuery = 'SELECT * FROM Admin WHERE userName = ?';
    const [existingAdmin] = await database.execute(existingAdminQuery, [userName]);

    if (existingAdmin.length === 0) return apiResponseErr(null, false, 400, 'Admin Does Not Exist');

    const admin = existingAdmin[0];

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) return apiResponseErr(null, false, 400, 'Invalid username or password');

    const accessTokenResponse = {
      id: admin.id,
      adminId: admin.adminId,
      userName: admin.userName,
      UserType: admin.userType || 'Admin',
    };

    const accessToken = jwt.sign(accessTokenResponse, process.env.JWT_SECRET_KEY, {
      expiresIn: '1d',
    });

    return res
      .status(200)
      .send(
        apiResponseSuccess(
          { accessToken, adminId: admin.adminId, userName: admin.userName, UserType: admin.userType || 'Admin' },
          true,
          200,
          'Admin login successfully',
        ),
      );
  } catch (error) {
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
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
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
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
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
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
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
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
      balance: updatedAdmin[0].balance,
    };
    return res.status(201).json(apiResponseSuccess(newAdmin, true, 201, 'Deposit balance successful'));
  } catch (error) {
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
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
      balance: user[0].balance,
      walletId: newUserWalletId,
    };
    return res.status(201).json(apiResponseSuccess(successResponse, true, 201, 'Send balance to User successful'));
  } catch (error) {
    console.error('Error sending balance:', error);
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// done
export const userUpdate = async (req, res) => {
  const { userId } = req.params;
  const { firstName, lastName, userName, phoneNumber, password } = req.body;

  try {
    let updateUserQuery = 'UPDATE User SET';
    const updateParams = [];

    if (firstName) {
      updateUserQuery += ' firstName = ?,';
      updateParams.push(firstName);
    }
    if (lastName) {
      updateUserQuery += ' lastName = ?,';
      updateParams.push(lastName);
    }
    if (userName) {
      updateUserQuery += ' userName = ?,';
      updateParams.push(userName);
    }
    if (phoneNumber) {
      updateUserQuery += ' phoneNumber = ?,';
      updateParams.push(phoneNumber);
    }
    if (password) {
      const passwordSalt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, passwordSalt);
      updateUserQuery += ' password = ?,';
      updateParams.push(hashedPassword);
    }

    updateUserQuery = updateUserQuery.slice(0, -1) + ' WHERE id = ?';
    updateParams.push(userId);

    await database.execute(updateUserQuery, updateParams);

    res.status(200).send(apiResponseSuccess(null, true, 200, 'User updated successfully'));
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send(apiResponseErr(null, false, 500, error.message));
  }
};
// done
export const deleteGame = async (req, res) => {
  const gameId = req.params.gameId;
  try {
    if (!gameId) {
      return res.status(400).send(apiResponseErr(null, false, 400, 'Game ID cannot be empty'));
    }
    const deleteRateQuery =
      'DELETE FROM Rate WHERE runnerId IN (SELECT runnerId FROM Runner WHERE marketId IN (SELECT marketId FROM Market WHERE gameId = ?))';
    await database.execute(deleteRateQuery, [gameId]);

    const deleteRunnerQuery = 'DELETE FROM Runner WHERE marketId IN (SELECT marketId FROM Market WHERE gameId = ?)';
    await database.execute(deleteRunnerQuery, [gameId]);

    const deleteMarketQuery = 'DELETE FROM Market WHERE gameId = ?';
    await database.execute(deleteMarketQuery, [gameId]);

    const deleteGameQuery = 'DELETE FROM Game WHERE gameId = ?';
    const [result] = await database.execute(deleteGameQuery, [gameId]);

    if (result.affectedRows === 0) {
      return res.status(404).send(apiResponseErr(null, false, 404, 'Game not found'));
    }

    res.status(200).send(apiResponseSuccess(null, true, 200, 'Game deleted successfully'));
  } catch (error) {
    res.status(500).send(apiResponseErr(null, false, 500, error.message));
  }
};
// done
export const deleteMarket = async (req, res) => {
  try {
    const { marketId } = req.params;

    const deleteRateQuery = 'DELETE FROM Rate WHERE runnerId IN (SELECT runnerId FROM Runner WHERE marketId = ?)';
    await database.execute(deleteRateQuery, [marketId]);

    const deleteRunnerQuery = 'DELETE FROM Runner WHERE marketId = ?';
    await database.execute(deleteRunnerQuery, [marketId]);

    const deleteMarketQuery = 'DELETE FROM Market WHERE marketId = ?';
    const [result] = await database.execute(deleteMarketQuery, [marketId]);

    if (result.affectedRows === 0) {
      return res.status(404).send(apiResponseErr(null, false, 404, 'Market not found'));
    }

    res.status(200).send(apiResponseSuccess(null, true, 200, 'Market deleted successfully'));
  } catch (error) {
    res.status(500).send(apiResponseErr(null, false, 500, error.message));
  }
};
// done
export const deleteRunner = async (req, res) => {
  const runnerId = req.params.runnerId;
  try {
    const deleteRunnerQuery = 'DELETE FROM Runner WHERE runnerId = ?';
    const [result] = await database.execute(deleteRunnerQuery, [runnerId]);

    if (result.affectedRows === 0) {
      throw apiResponseErr(null, false, 400, 'Runner not found');
    }

    res.status(200).send(apiResponseSuccess(null, true, 200, 'Runner deleted successfully'));
  } catch (error) {
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};


export const afterWining = async (req, res) => {
  const { marketId, runnerId, isWin } = req.body;
  try {
    // Find the runner in the market
    let query = `
      SELECT g.gameId
      FROM game g
      JOIN market m ON g.gameId = m.gameId
      JOIN runner r ON m.marketId = r.marketId
      WHERE r.runnerId = ? AND m.marketId = ?
    `;
    let [rows] = await database.execute(query, [runnerId, marketId]);

    if (rows.length === 0) {
      throw new Error('Runner not found');
    }

    let gameId = rows[0].gameId;

    // Update runner isWin in market
    query = `
      UPDATE runner
      SET isWin = CASE WHEN runnerId = ? THEN ? ELSE 0 END
      WHERE marketId = ?;
    `;
    await database.execute(query, [runnerId, isWin ? 1 : 0, marketId]);

    // Update user balances
    query = `
      SELECT u.id, ub.runnerId, ub.bal, u.marketListExposure
      FROM user u
      JOIN marketbalance ub ON u.id = ub.userId
      WHERE ub.marketId = ? AND ub.runnerId = ?;
    `;
    [rows] = await database.execute(query, [marketId, runnerId]);

    for (const row of rows) {
      const { id, runnerId, bal, marketListExposure } = row;
      let marketExposure = null;
      try {
        marketExposure = JSON.parse(marketListExposure);
      } catch (error) {
        throw new Error(`Failed to parse marketListExposure JSON for user id ${id}: ${error.message}`);
      }

      // Find the market exposure for the current marketId
      const exposureIndex = marketExposure.findIndex(item => Object.keys(item)[0] === marketId);

      if (exposureIndex !== -1) {
        const exposureValue = Number(Object.values(marketExposure[exposureIndex])[0]);

        if (!isNaN(exposureValue)) {
          if (isWin) {
            query = `
              UPDATE user
              SET balance = balance + ?
              WHERE id = ?;
            `;
            await database.execute(query, [bal + exposureValue, id]);
          } else {
            query = `
              UPDATE marketbalance
              SET bal = bal - ?
              WHERE userId = ? AND marketId = ? AND runnerId = ?;
            `;
            await database.execute(query, [exposureValue, id, marketId, runnerId]);

            query = `
              UPDATE user
              SET balance = balance + ?
              WHERE id = ?;
            `;
            await database.execute(query, [bal, id]);
          }

          query = `
            INSERT INTO profitloss (userId, gameId, marketId, runnerId, date, profitLoss)
            VALUES (?, ?, ?, ?, ?, ?);
          `;
          const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
          await database.execute(query, [id, gameId, marketId, runnerId, date, bal]);

          query = `
            UPDATE user
            SET marketListExposure = JSON_REMOVE(marketListExposure, CONCAT('$[', ? ,']'))
            WHERE id = ?;
          `;
          await database.execute(query, [exposureIndex, id]);
        }
      }
    }

    // Update announcement result in market
    if (isWin) {
      query = `
        UPDATE market
        SET announcementResult = 1
        WHERE marketId = ?;
      `;
      await database.execute(query, [marketId]);

      query = `
        INSERT INTO bethistory (userId, gameId, gameName, marketId, marketName, runnerId, runnerName, rate, value, type, date, bidAmount, isWin, profitLoss)
        SELECT userId, gameId, gameName, marketId, marketName, runnerId, runnerName, rate, value, type, ?, bidAmount, isWin, profitLoss
        FROM currentorder
        WHERE marketId = ?;
      `;
      const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await database.execute(query, [date, marketId]);

      query = `
        DELETE FROM currentorder
        WHERE marketId = ?;
      `;
      await database.execute(query, [marketId]);
    }

    return res.status(200).send(apiResponseSuccess(null, true, 200, 'success'));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(error.responseCode ?? 500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
