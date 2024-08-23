import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js';
import Market from './market.model.js';
import Runner from './runner.model.js';
import Game from './game.model.js';

class ProfitLoss extends Model { }

ProfitLoss.init(
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
    gameId: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    marketId: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    runnerId: {
      type: DataTypes.CHAR(36),
      allowNull: true,
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
ProfitLoss.belongsTo(Runner, { foreignKey: 'runnerId', targetKey: 'runnerId', onDelete: 'SET NULL' });
Runner.hasMany(ProfitLoss, { foreignKey: 'runnerId', sourceKey: 'runnerId' });

ProfitLoss.belongsTo(Market, { foreignKey: 'marketId', targetKey: 'marketId', onDelete: 'SET NULL' });
Market.hasMany(ProfitLoss, { foreignKey: 'marketId', sourceKey: 'marketId' });

ProfitLoss.belongsTo(Game, { foreignKey: 'gameId', targetKey: 'gameId', onDelete: 'SET NULL' });
Game.hasMany(ProfitLoss, { foreignKey: 'gameId', sourceKey: 'gameId' });
export default ProfitLoss;
