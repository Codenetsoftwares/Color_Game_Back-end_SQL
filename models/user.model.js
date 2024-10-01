import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js';
import { v4 as uuid4 } from 'uuid';

class userSchema extends Model { }
userSchema.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roles: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    eligibilityCheck: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    walletId: {
      type: DataTypes.UUID,
      defaultValue: uuid4(),
      allowNull: true,
    },
    balance: {
      type: DataTypes.INTEGER,
      defaultValue: 0.0,
    },
    exposure: {
      type: DataTypes.INTEGER,
      defaultValue: 0.0,
    },
    marketListExposure: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    token: {
      type: DataTypes.STRING,
    },
    isReset: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastLoginTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    loginStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  },
  {
    sequelize,
    modelName: 'userSchema',
    tableName: 'user',
    timestamps: false,
  },
);
export default userSchema;
