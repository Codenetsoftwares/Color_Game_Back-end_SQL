import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js';

class userSchema extends Model {}
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
      // primaryKey: true,
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
      type: DataTypes.STRING,
      allowNull: true,
    },
    balance: {
      type: DataTypes.INTEGER, // Adjust based on your needs
      defaultValue: 0.0,
    },
    exposure: {
      type: DataTypes.INTEGER, // Adjust based on your needs
      defaultValue: 0.0,
    },
    marketListExposure: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'userSchema',
    tableName: 'user',
    timestamps: false,
  },
);
export default userSchema;
