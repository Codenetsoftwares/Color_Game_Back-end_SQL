import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js';

class sliderSchema extends Model {}

sliderSchema.init(
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
      sliderCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      }
  },
  {
    sequelize,
    modelName: 'slider',
    tableName: 'slider',
    timestamps: false,
  }
);

export default sliderSchema;