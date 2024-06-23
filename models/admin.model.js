import { DataTypes } from 'sequelize';
import sequelize from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const admins = sequelize.define(
  'admins',
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    adminId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roles: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    walletId: {
      type: DataTypes.UUID,
      defaultValue: uuidv4(),
      allowNull: true,
    },
    balance: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    timestamps: false,
  },
);

export default admins;
