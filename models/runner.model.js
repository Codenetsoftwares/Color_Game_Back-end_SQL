import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js';

class Runner extends Model {}

Runner.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    marketId: {
      type: DataTypes.CHAR(150),
      allowNull: false,
      references: {
        model: 'market',
        key: 'marketId',
      },
    },
    runnerId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    runnerName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    isWin: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    bal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    back: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
    },
    lay: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
    },
    hideRunner : {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  },
  {
    sequelize,
    modelName: 'Runner',
    tableName: 'runner',
    timestamps: true, 
    updatedAt: false,
    paranoid: true, // Enable soft delete
    deletedAt: 'deletedAt',
  },
);

export default Runner;
