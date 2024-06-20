import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

class userSchema extends Model {}

userSchema.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
      // primaryKey: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roles: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    eligibilityCheck: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    walletId: {
      type: DataTypes.UUID,
      defaultValue: uuidv4(),
      allowNull: true,
    },
    balance: {
      type: DataTypes.INTEGER,
      defaultValue: 0.0,
    },
    exposure: {
      type: DataTypes.INTEGER,
      defaultValue: 0.0,
    },
    marketListExposure: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'user',
    timestamps: false,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  },
);

userSchema.prototype.validPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export default userSchema;
