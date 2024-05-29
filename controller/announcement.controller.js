import { apiResponseSuccess, apiResponseErr } from '../middleware/serverError.js';
import { database } from '../controller/database.controller.js';
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
    const [existingAnnouncementResult] = await database.execute(existingAnnouncementQuery, [
      game.gameId,
      typeOfAnnouncement,
    ]);
    let announce = existingAnnouncementResult[0];

    if (!announce) {
      const announceId = uuidv4();
      const insertAnnouncementQuery = `
                INSERT INTO Announcement (gameId, announceId, typeOfAnnouncement, announcement)
                VALUES (?, ?, ?, ?)
            `;
      await database.execute(insertAnnouncementQuery, [game.gameId, announceId, typeOfAnnouncement, announcement]);

      const newAnnouncementQuery = 'SELECT * FROM Announcement WHERE announceId = ?';
      const [newAnnouncementResult] = await database.execute(newAnnouncementQuery, [announceId]);
      announce = newAnnouncementResult[0];
    } else {
      const updateAnnouncementQuery = 'UPDATE Announcement SET announcement = ? WHERE announceId = ?';
      await database.execute(updateAnnouncementQuery, [announcement, announce.announceId]);
      announce.announcement = announcement;
    }

    return res.status(201).json(apiResponseSuccess(announce, true, 201, 'Announcement created successfully'));
  } catch (error) {
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
// done
export const getAnnouncement = async (req, res) => {
  try {
    const { announceId } = req.params;
    const announcementQuery = `
            SELECT * 
            FROM Announcement 
            WHERE announceId = ?
        `;
    const [announcementResult] = await database.execute(announcementQuery, [announceId]);
    const announcement = announcementResult[0];

    if (!announcement) {
      return res.status(400).json(apiResponseErr(null, false, 400, 'Announcement not found'));
    }

    const announcementText = announcement.announcement;

    return res.status(201).json(
      apiResponseSuccess(
        {
          announceId: announcement.announceId,
          typeOfAnnouncement: announcement.typeOfAnnouncement,
          announcement: [announcementText],
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
    if (typeOfAnnouncement === undefined && announcement === undefined) {
      return res
        .status(400)
        .json(apiResponseErr(null, false, 400, 'At least one of typeOfAnnouncement or announcement is required'));
    }

    const announcementQuery = `
            SELECT *
            FROM Announcement
            WHERE announceId = ?
        `;
    const [announcementResult] = await database.execute(announcementQuery, [announceId]);
    const announcementToUpdate = announcementResult[0];

    if (!announcementToUpdate) return res.status(400).json(apiResponseErr(null, false, 400, 'Announcement not found'));

    if (typeOfAnnouncement !== undefined) {
      const updateTypeOfAnnouncementQuery = `
                UPDATE Announcement
                SET typeOfAnnouncement = ?
                WHERE announceId = ?
            `;
      await database.execute(updateTypeOfAnnouncementQuery, [typeOfAnnouncement, announceId]);
    }

    if (announcement !== undefined) {
      const updateAnnouncementQuery = `
                UPDATE Announcement
                SET announcement = ?
                WHERE announceId = ?
            `;
      await database.execute(updateAnnouncementQuery, [announcement, announceId]);
    }

    return res.status(201).json(apiResponseSuccess(null, true, 201, 'Announcement updated successfully'));
  } catch (error) {
    res
      .status(500)
      .send(apiResponseErr(error.data ?? null, false, error.responseCode ?? 500, error.errMessage ?? error.message));
  }
};
