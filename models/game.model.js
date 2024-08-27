import { DataTypes, Model } from "sequelize";
import sequelize from "../db.js";

class Game extends Model {}

Game.init(
  {
    gameId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      unique : true
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
