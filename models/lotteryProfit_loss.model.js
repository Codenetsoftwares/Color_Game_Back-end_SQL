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
            allowNull: true,
        },
        marketName: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        ticketNumber: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        sem: {
            type: DataTypes.INTEGER,
            allowNull: false,
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
