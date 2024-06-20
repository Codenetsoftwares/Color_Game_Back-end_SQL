import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js';

class MarketBalance extends Model {}

MarketBalance.init(
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
    marketId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
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
  }
);

export default MarketBalance;
