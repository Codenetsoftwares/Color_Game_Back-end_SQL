import { Op } from "sequelize";
import Market from "../models/market.model.js";
import cron from 'node-cron'


export const startMarketCountdown = () => {
    console.log("Enter in startMarketCountdown");

    cron.schedule('*/30 * * * * *', async () => {
        try {
            console.log('Checking market statuses...');

            const markets = await Market.findAll({
                where: {
                    isActive: true,
                    endTime: { [Op.lte]: new Date() }
                },

            });

            for (const market of markets) {

                market.isActive = false;
               const response = await market.save();
               
                console.log("Markets Inactivated:", response);

                console.log(`Market ${market.marketName} has been deactivated.`);
            }
        } catch (error) {
            console.error('Error checking market statuses:', error);
        }
    });
};
