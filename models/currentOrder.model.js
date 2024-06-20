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
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    gameName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    marketId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    marketName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    runnerId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    runnerName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rate: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    bidAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    isWin: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null,
    },
    profitLoss: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    exposure: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'CurrentOrder',
    tableName: 'currentOrder',
    timestamps: false,
    underscored: true, // This will ensure that table name uses underscored format
  }
);

export default CurrentOrder;
