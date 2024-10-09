import { DataTypes, json, Model } from 'sequelize';
import sequelize from '../db.js';

class InactiveGame extends Model {}

InactiveGame.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    game: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    market: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    runner: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'InactiveGame',
    tableName: 'InactiveGame',
    timestamps: true,
    updatedAt: false,
  },
);

export default InactiveGame;
