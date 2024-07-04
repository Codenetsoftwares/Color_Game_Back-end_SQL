import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js';
import { v4 as uuidv4 } from 'uuid';

class transactionRecord extends Model {}

transactionRecord.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transactionId: {
      type: DataTypes.STRING,
    },
    transactionType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    trDone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transferFromUserAccount: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transferToUserAccount: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'transactionRecord',
    timestamps: true,
  },
);

export default transactionRecord;
