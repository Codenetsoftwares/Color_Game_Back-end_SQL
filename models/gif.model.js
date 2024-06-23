import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js';

class gifSchema extends Model {}

gifSchema.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    imageId: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    text: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    headingText: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'gif',
    tableName: 'gif',
    timestamps: false,
  },
);

export default gifSchema;
