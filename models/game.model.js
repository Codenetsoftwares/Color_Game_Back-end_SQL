import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js';

class gameSchema extends Model {}

gameSchema.init({
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
}, {
  sequelize,
  modelName: 'game',
  tableName: 'game',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['gameId'], 
    },
  ],
});

export default gameSchema;
