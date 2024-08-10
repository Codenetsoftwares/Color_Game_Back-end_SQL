import { DataTypes, Model } from "sequelize";
import sequelize from "../db.js";

class Game extends Model {}

Game.init(
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
    gameName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isBlink: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    activeInactive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "Game",
    tableName: "game",
    timestamps: true,
    updatedAt: false,
  }
);

export default Game;
