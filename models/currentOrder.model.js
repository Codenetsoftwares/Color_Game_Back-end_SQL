import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js';

class CurrentOrder extends Model {}

CurrentOrder.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    gameId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    gameName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    marketId: {
      type: DataTypes.CHAR(150),
      allowNull: false,
    },
    marketName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    runnerId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    runnerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    bidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    isWin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    profitLoss: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    exposure: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'CurrentOrder',
    tableName: 'currentOrder',
    timestamps: false,
  }
);

export default CurrentOrder;
