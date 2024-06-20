import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js'; 
import gameSchema from './game.model.js';

class marketSchema extends Model {}

marketSchema.init(
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
      unique: true, // Ensure marketId is unique
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
  },
  {
    sequelize,
    modelName: 'market',
    tableName: 'market',
    timestamps: false,
    indexes: [
      {
        fields: ['gameId'],
        name: 'market_gameId_idx',
      },
      {
        unique: true,
        fields: ['marketId'], 
      },
    ],
  },
);

marketSchema.belongsTo(gameSchema, { foreignKey: 'gameId', targetKey: 'gameId' });

export default marketSchema;
