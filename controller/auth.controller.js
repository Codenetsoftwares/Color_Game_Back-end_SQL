import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { apiResponseErr, apiResponseSuccess } from '../middleware/serverError.js';
import { statusCode } from '../helper/statusCodes.js';
import admins from '../models/admin.model.js';
import userSchema from '../models/user.model.js';
import axios from 'axios';
import userTrashData from '../models/userTrashData.model.js';
import { v4 as uuid4 } from 'uuid';
import transactionRecord from '../models/transactionRecord.model.js';

// done
export const adminLogin = async (req, res) => {
  const { userName, password } = req.body;
  try {
    const existingAdmin = await admins.findOne({ where: { userName } });

    if (!existingAdmin) {
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, false, statusCode.badRequest, 'Admin Does Not Exist'));
    }

    const isPasswordValid = await bcrypt.compare(password, existingAdmin.password);

    if (!isPasswordValid) {
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, false, statusCode.badRequest, 'Invalid password'));
    }

    const accessTokenResponse = {
      id: existingAdmin.id,
      adminId: existingAdmin.adminId,
      userName: existingAdmin.userName,
      userType: existingAdmin.userType || 'admin',
    };

    const accessToken = jwt.sign(accessTokenResponse, process.env.JWT_SECRET_KEY, {
      expiresIn: '1d',
    });

    return res.status(statusCode.success).send(
      apiResponseSuccess(
        {
          accessToken,
          adminId: existingAdmin.adminId,
          userName: existingAdmin.userName,
          userType: existingAdmin.userType || 'admin',
        },
        true,
        statusCode.success,
        'Admin login successfully',
      ),
    );
  } catch (error) {
    console.error('Error in adminLogin:', error.message);
    res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          error.data ?? null,
          false,
          error.responseCode ?? statusCode.internalServerError,
          error.errMessage ?? error.message,
        ),
      );
  }
};

// done
export const loginUser = async (req, res) => {
  const { userName, password } = req.body;
  try {
    const existingUser = await userSchema.findOne({ where: { userName } });

    if (!existingUser) {
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, false, statusCode.badRequest, 'User does not exist'));
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);

    if (!isPasswordValid) {
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, false, statusCode.badRequest, 'Invalid password'));
    }

    const accessTokenResponse = {
      id: existingUser.id,
      userName: existingUser.userName,
      isEighteen: existingUser.eligibilityCheck,
      userType: existingUser.userType || 'user',
      wallet: existingUser.wallet,
    };

    const accessToken = jwt.sign(accessTokenResponse, process.env.JWT_SECRET_KEY, {
      expiresIn: '1d',
    });

    existingUser.token = accessToken
    await existingUser.save()

    res
      .status(statusCode.success)
      .send(
        apiResponseSuccess(
          {
            accessToken,
            userId: existingUser.userId,
            userName: existingUser.userName,
            isEighteen: existingUser.eligibilityCheck,
            userType: existingUser.userType || 'user',
            wallet: existingUser.wallet,
          },
          true,
          statusCode.success,
          'Login successful',
        ),
      );
  } catch (error) {
    res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          error.data ?? null,
          false,
          error.responseCode ?? statusCode.internalServerError,
          error.errMessage ?? error.message,
        ),
      );
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { userName, oldPassword, newPassword } = req.body;

    const existingUser = await userSchema.findOne({ where: { userName } });
    console.log('existingUser', existingUser)

    // if user exist then reset password
    if (existingUser) {
      const isPasswordMatch = await bcrypt.compare(oldPassword, existingUser.password);
      if (!isPasswordMatch) {
        return res.status(statusCode.badRequest).send(apiResponseErr(null, false, statusCode.badRequest, 'Invalid old password.'));
      }
      console.log('existingUser', existingUser)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await existingUser.update({ password: hashedPassword });
    
      const dataToSend = {
        userName,
        oldPassword,
        newPassword
      };
  
      console.log("dataToSend", dataToSend)
      const response = await axios.post('https://wl.server.dummydoma.in/api/external/reset-password', dataToSend);
      console.log("response", response)
  
      console.log('Reset password response:', response.data);
  
      if (!response.data.success) {
        return res.status(statusCode.badRequest).send(apiResponseErr(null, false, statusCode.badRequest, 'Please contact admin.'));
      }

      return res.status(statusCode.success).send(apiResponseSuccess(null, true, statusCode.success, 'Password reset successfully.'));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const newUser = await userSchema.create({
      userName: response.data.data.userName,
      userId: response.data.data.userId,
      password: hashedPassword,
      balance: response.data.data.balance,
      roles: 'user',
    });

    return res.status(statusCode.success).send(apiResponseSuccess(newUser, true, statusCode.success, 'User password reset successfully'));
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(statusCode.internalServerError).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? statusCode.internalServerError, error.errMessage ?? error.message));
  }
};

export const trashUser = async (req, res) => {
  try {
    const { userId } = req.body;

    const existingUser = await userSchema.findOne({ where: { userId } });

    if (!existingUser) {
      return res.status(statusCode.success).json(apiResponseErr(null, false, statusCode.success, 'User not found'));
    }

    const serializedUserData = JSON.stringify(existingUser);

    const trashEntry = await userTrashData.create({
      trashId: uuid4(),
      userId : existingUser.userId,
      data: serializedUserData,
    });

    if (!trashEntry) {
      return res.status(statusCode.internalServerError).json(apiResponseErr(null, statusCode.internalServerError, false, `Failed to backup User`));
    }

    const deleteUser = await existingUser.destroy();

    if (!deleteUser) {return res.status(statusCode.internalServerError).json(apiResponseErr(null, statusCode.internalServerError, false, `Failed to delete User with userId: ${userId}`));
    }

    return res.status(statusCode.success).send(apiResponseSuccess(null, true, statusCode.success, 'User trashed successfully'));
  } catch (error) {
    console.error('Error trashing user:', error);
    return res.status(statusCode.internalServerError).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? statusCode.internalServerError, error.errMessage ?? error.message));
  }
};

export const restoreTrashUser = async (req, res) => {
  try {
    const { userId } = req.body;

    const existingUser = await userTrashData.findOne({ where: { userId } });

    if (!existingUser) {
      return res.status(statusCode.success).json(apiResponseErr(null, false, statusCode.success, 'User not found in trash'));
    }

    const serializedUserData = JSON.parse(existingUser.data);

    const trashEntry = await userSchema.create({
      firstName : serializedUserData.firstName,
      lastName : serializedUserData.lastName,
      userName : serializedUserData.userName,
      userId : serializedUserData.userId,
      phoneNumber : serializedUserData.phoneNumber,
      password : serializedUserData.password,
      roles : serializedUserData.roles,
      eligibilityCheck : serializedUserData.eligibilityCheck,
      walletId : serializedUserData.walletId,
      balance : serializedUserData.balance,
      exposure : serializedUserData.exposure,
      marketListExposure : serializedUserData.marketListExposure
    });

    if (!trashEntry) {
      return res.status(statusCode.badRequest).json(apiResponseErr(null, false, statusCode.badRequest, 'Failed to restore User'));
    }

    const deleteUser = await existingUser.destroy();

    if (!deleteUser) {
      return res.status(statusCode.badRequest).json(apiResponseErr(null, false, statusCode.badRequest, `Failed to delete User with userId: ${userId} from trash`));
    }

    return res.status(statusCode.success).send(apiResponseSuccess(null, true, statusCode.success, 'User restored successfully'));
  } catch (error) {
    console.error('Error restoring user:', error);
    return res.status(statusCode.internalServerError).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? statusCode.internalServerError, error.errMessage ?? error.message));
  }
};


export const logout = async (req, res) => {
  try {
    const { userId } = req.body;

    const users = await userSchema.findOne({ where: { userId } });

    if (!users) {
      return res
        .status(statusCode.badRequest)
        .send(apiResponseErr(null, false, statusCode.badRequest, 'User not found'));
    }

    users.token = null;
    await users.save();

    return res
      .status(statusCode.success)
      .send(apiResponseSuccess(null, true, statusCode.success, 'Logged out successfully'));
  } catch (error) {
    return res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          error.data ?? null,
          false,
          error.responseCode ?? statusCode.internalServerError,
          error.errMessage ?? error.message
        )
      );
  }
};


