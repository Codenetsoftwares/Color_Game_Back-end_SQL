import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js';

class userTrashData extends Model {}

userTrashData.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    trashId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
      },
  },
  {
    sequelize,
    modelName: 'userTrashData',
    timestamps: true,
  },
);

export default userTrashData;
