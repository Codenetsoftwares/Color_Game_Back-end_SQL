import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { apiResponseErr, apiResponseSuccess } from '../middleware/serverError.js';
import { statusCode } from '../helper/statusCodes.js';
import admins from '../models/admin.model.js';
import userSchema from '../models/user.model.js';
import axios from 'axios';

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

    if (existingUser) {
      return res.status(statusCode.badRequest).send(apiResponseErr(null, false, statusCode.badRequest, 'User already exists.'));
    }

    const dataToSend = {
      userName,
      oldPassword,
      newPassword
    };

    const response = await axios.post('http://localhost:8000/api/external/reset-password', dataToSend);

    console.log('Reset password response:', response.data);

    if (!response.data.success) {
      return res.status(statusCode.badRequest).send(apiResponseErr(null, false, statusCode.badRequest, 'Please contact admin.'));
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
