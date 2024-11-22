import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js';

class LotteryProfit_Loss extends Model { }

LotteryProfit_Loss.init(
    {
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        userName: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        marketId: {
            type: DataTypes.CHAR(36),
            allowNull: false,
        },
        marketName: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        ticketNumber: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        sem: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        profitLoss: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.0,
        },

    },
    {
        sequelize,
        modelName: 'LotteryProfit_Loss',
        tableName: 'LotteryProfit_Loss',
        timestamps: false,
    },
);

export default LotteryProfit_Loss;
