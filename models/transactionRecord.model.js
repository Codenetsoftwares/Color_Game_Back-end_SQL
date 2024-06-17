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
    transactionType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
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
