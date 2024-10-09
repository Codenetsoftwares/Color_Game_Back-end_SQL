import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js';
import Market from './market.model.js';

class MarketBalance extends Model {}

MarketBalance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    marketId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: Market,
        key: 'marketId',
      },
    },
    runnerId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    bal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
  },
  {
    sequelize,
    modelName: 'MarketBalance',
    tableName: 'MarketBalance',
    timestamps: false,
    indexes: [
      {
        unique: false,
        fields: ['userId', 'marketId', 'runnerId'],
      },
    ],
  },
);

export default MarketBalance;
