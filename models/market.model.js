import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js';

class Market extends Model {}

Market.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    gameId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    marketId: {
      type: DataTypes.CHAR(150),
      allowNull: false,
    },
    marketName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    participants: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    timeSpan: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    announcementResult: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isDisplay: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    hideMarket : {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  },
  {
    sequelize,
    modelName: 'Market',
    tableName: 'market',
    timestamps: true, 
    updatedAt: false,
  },
);

export default Market; 
