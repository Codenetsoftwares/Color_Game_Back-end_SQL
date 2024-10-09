import { Op } from 'sequelize';
import Market from '../models/market.model.js';
import cron from 'node-cron';
import { apiResponseSuccess } from '../middleware/serverError.js';
import { statusCode } from '../helper/statusCodes.js';
import express from 'express';
const app = express();

export const startMarketCountdown = () => {
  console.log('Enter in startMarketCountdown');

  cron.schedule('*/30 * * * * *', async () => {
    try {
      console.log('Checking market statuses...');

      const markets = await Market.findAll({
        where: {
          isActive: true,
          endTime: { [Op.lte]: new Date() },
        },
      });
      let updateMarket = [];
      for (const market of markets) {
        market.isActive = false;
        const response = await market.save();

        console.log('Markets Inactivated:', response);

        console.log(`Market ${market.marketName} has been deactivated.`);
        updateMarket.push(market);
      }
      app.get('/events', (req, res) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        return res
          .status(statusCode.success)
          .json(apiResponseSuccess(updateMarket, true, statusCode.success, 'List of updated market'));
      });
    } catch (error) {
      console.error('Error checking market statuses:', error);
    }
  });
};
