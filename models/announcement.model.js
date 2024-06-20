import { DataTypes } from 'sequelize';
import sequelize from '../db.js';
import gameSchema from './game.model.js';

const announcementSchema = sequelize.define('announcement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  gameId: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  announceId: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  typeOfAnnouncement: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  announcement: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, 
{
    sequelize,
    modelName: 'announcements',
    tableName: 'announcements',
    timestamps: true,
  }
);

announcementSchema.belongsTo(gameSchema, { foreignKey: 'gameId', targetKey: 'gameId' });

export default announcementSchema;