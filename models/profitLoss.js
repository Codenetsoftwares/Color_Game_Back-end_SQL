import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js';

class ProfitLoss extends Model {}

ProfitLoss.init(
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
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    marketId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    runnerId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    profitLoss: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'ProfitLoss',
    tableName: 'ProfitLoss',
    timestamps: false,
    indexes: [
      {
        unique: false,
        fields: ['userId', 'gameId', 'marketId', 'runnerId'],
      },
    ],
  },
);

export default ProfitLoss;
