import { apiResponseSuccess, apiResponseErr } from '../middleware/serverError.js';
import { database } from '../controller/database.controller.js'
import { v4 as uuidv4 } from 'uuid';


// done
export const announcements = async (req, res) => {
    const { typeOfAnnouncement, announcement } = req.body;
    try {
       
        const gameQuery = 'SELECT * FROM Game WHERE gameName = ?';
        const [gameResult] = await database.execute(gameQuery, [typeOfAnnouncement]);
        const game = gameResult[0];

        if (!game) {
            return res.status(400).json(apiResponseErr(null, false, 400, 'Game not found'));
        }

        const existingAnnouncementQuery = 'SELECT * FROM Announcement WHERE gameId = ? AND typeOfAnnouncement = ?';
        const [existingAnnouncementResult] = await database.execute(existingAnnouncementQuery, [game.gameId, typeOfAnnouncement]);
        let announce = existingAnnouncementResult[0];

        if (!announce) {
            const announceId = uuidv4();
            const announcementString = Array.isArray(announcement) ? announcement.join('') : announcement; // Convert array of characters to string
            const insertAnnouncementQuery = `
                INSERT INTO Announcement (gameId, announceId, typeOfAnnouncement, announcement)
                VALUES (?, ?, ?, ?)
            `;
            await database.execute(insertAnnouncementQuery, [game.gameId, announceId, typeOfAnnouncement, announcementString]);

            const newAnnouncementQuery = 'SELECT * FROM Announcement WHERE announceId = ?';
            const [newAnnouncementResult] = await database.execute(newAnnouncementQuery, [announceId]);
            announce = newAnnouncementResult[0];
        } else {
            const updatedAnnouncement = [...announce.announcement, announcement];
            const updateAnnouncementQuery = 'UPDATE Announcement SET announcement = ? WHERE announceId = ?';
            await database.execute(updateAnnouncementQuery, [JSON.stringify(updatedAnnouncement), announce.announceId]);
        }

        return res.status(201).json(apiResponseSuccess(announce, true, 201, 'Announcement created successfully'));
    } catch (error) {
        res.status(500).send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
    }
};

// done
export const getAnnouncement = async (req, res) => {
    const { announceId } = req.params;

    try {
        const announcer = await Announcement.findOne();
        const announcement = announcer.announcements.find((a) => String(a.announceId) === announceId);

        if (!announcement) {
            return res.status(400).json(apiResponseErr(null, false, 400, 'Announcement not found'));
        }

        const latestAnnouncement = announcer.announcements
            .filter((a) => a.typeOfAnnouncement === announcement.typeOfAnnouncement)
            .reduce((latest, current) => (latest.announceId < current.announceId ? current : latest));

        return res.status(201).json(
            apiResponseSuccess(
                {
                    announcementId: latestAnnouncement.announceId,
                    typeOfAnnouncement: latestAnnouncement.typeOfAnnouncement,
                    announcement: [latestAnnouncement.announcement[latestAnnouncement.announcement.length - 1]],
                },
                true,
                201,
                'Success',
            ),
        );
    } catch (error) {
        res
            .status(500)
            .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
    }
};
// done
export const updateAnnouncement = async (req, res) => {
    const announceId = req.params.announceId;
    const { typeOfAnnouncement, announcement } = req.body;

    try {
        console.log('announceId', announceId);
        const announce = await Announcement.findOne();
        const announcementToUpdate = announce.announcements.find((a) => String(a.announceId) === announceId);

        if (!announcementToUpdate) return res.status(400).json(apiResponseErr(null, false, 400, 'Announcement not found'));

        const existingAnnouncement = announce.announcements.find(
            (a) => a.typeOfAnnouncement === typeOfAnnouncement && String(a.announceId) !== announceId,
        );

        if (existingAnnouncement) return res.status(400).json(apiResponseErr(null, false, 400, 'Already exists'));

        if (typeOfAnnouncement !== undefined) {
            announcementToUpdate.typeOfAnnouncement = typeOfAnnouncement;
        }

        if (announcement !== undefined) {
            announcementToUpdate.announcement = announcement;
        }

        const updateAnnouncement = await announce.save();
        return res.status(201).json(apiResponseSuccess(updateAnnouncement, true, 201, 'Announcement Update Successfully'));
    } catch (error) {
        res
            .status(500)
            .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
    }
};