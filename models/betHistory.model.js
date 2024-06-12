import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js';

class betHistory extends Model {}

betHistory.init({
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
  gameName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  marketId: {
    type: DataTypes.CHAR(150),
    allowNull: false,
  },
  marketName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  runnerId: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  runnerName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  bidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  isWin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  profitLoss: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  exposure: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'betHistory',
  tableName: 'betHistory',
  timestamps: false,
});

export default betHistory;
