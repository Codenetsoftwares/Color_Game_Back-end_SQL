import cron from 'node-cron'
import Market from './models/market.model';

cron.schedule('* * * * *', async () => {
    try {
        console.log('Checking market statuses...');

        const markets = await Market.findAll({
            where: { isActive: true, endTime: { [Op.lte]: new Date() } },
        });

        for (const market of markets) {
            market.isActive = false;
            await market.save();

            console.log(`Market ${market.marketName} has been deactivated.`);

        }
    } catch (error) {
        console.error('Error checking market statuses:', error);
    }
});