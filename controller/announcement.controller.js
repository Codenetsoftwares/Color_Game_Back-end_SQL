import { apiResponseSuccess, apiResponseErr } from '../middleware/serverError.js';
import { database } from '../controller/database.controller.js';
import { v4 as uuidv4 } from 'uuid';
import gameSchema from '../models/game.model.js';
import announcementSchema from '../models/announcement.model.js';
import { statusCode } from '../helper/statusCodes.js';

// done
export const announcements = async (req, res) => {
  const { typeOfAnnouncement, announcement } = req.body;
  try {
    const game = await gameSchema.findOne({ where: { gameName: typeOfAnnouncement } });

    if (!game) {
      return res.status(400).json(apiResponseErr(null, false, 400, 'Game not found'));
    }

    let announce = await announcementSchema.findOne({
      where: { gameId: game.gameId, typeOfAnnouncement },
    });

    if (!announce) {
      const announceId = uuidv4();
      announce = await announcementSchema.create({
        gameId: game.gameId,
        announceId: announceId,
        typeOfAnnouncement,
        announcement,
      });
    } else {
      await announce.update({ announcement });
    }

    return res
      .status(statusCode.create)
      .json(apiResponseSuccess(announce, true, statusCode.create, 'Announcement created successfully'));
  } catch (error) {
    res.status(statusCode.internalServerError).send(
      apiResponseErr(
        error.data ?? null,
        false,
        error.responseCode ?? statusCode.internalServerError,
        error.errMessage ?? error.message,
      ),
    );
  }
};

// done
export const getAnnouncement = async (req, res) => {
  try {
    const { announceId } = req.params;
    
    const announcement = await announcementSchema.findOne({ where: { announceId } });

    if (!announcement) {
      return res.status(400).json(apiResponseErr(null, false, 400, 'Announcement not found'));
    }

    const announcementText = announcement.announcement;

    return res.status(statusCode.create).json(
      apiResponseSuccess(
        {
          announceId: announcement.announceId,
          typeOfAnnouncement: announcement.typeOfAnnouncement,
          announcement: [announcementText],
        },
        true,
        statusCode.success,
        'Success',
      ),
    );
  } catch (error) {
    res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          error.data ?? null,
          false,
          error.responseCode ?? statusCode.internalServerError,
          error.errMessage ?? error.message,
        ),
      );
  }
};
// done
export const updateAnnouncement = async (req, res) => {
  const announceId = req.params.announceId;
  const { typeOfAnnouncement, announcement } = req.body;

  try {
    const announcementToUpdate = await announcementSchema.findOne({ where: { announceId } });

    if (!announcementToUpdate) {
      return res.status(400).json(apiResponseErr(null, false, 400, 'Announcement not found'));
    }

    if (typeOfAnnouncement !== undefined) {
      announcementToUpdate.typeOfAnnouncement = typeOfAnnouncement;
    }

    if (announcement !== undefined) {
      announcementToUpdate.announcement = announcement;
    }

    await announcementToUpdate.save();

    return res
      .status(statusCode.create)
      .json(apiResponseSuccess(null, true, statusCode.create, 'Announcement updated successfully'));
  } catch (error) {
    res.status(statusCode.internalServerError).send(
      apiResponseErr(
        error.data ?? null,
        false,
        error.responseCode ?? statusCode.internalServerError,
        error.errMessage ?? error.message,
      ),
    );
  }
};
// done
export const getAnnouncementUser = async (req, res) => {
  try {
    const announceId = req.params.announceId;

    const announcementData = await announcementSchema.findAll({ where: { announceId } });

    if (announcementData.length === 0) {
      throw apiResponseErr(null, false, statusCode.badRequest, 'Announcement not found');
    }

    const latestAnnouncement = announcementData.reduce((latest, current) => {
      if (latest.announceId < current.announceId) {
        return current;
      }
      return latest;
    });

    res.status(statusCode.success).send(
      apiResponseSuccess(
        {
          announcementId: latestAnnouncement.announceId,
          typeOfAnnouncement: latestAnnouncement.typeOfAnnouncement,
          announcement: [latestAnnouncement.announcement],
        },
        true,
        statusCode.success,
        'success',
      ),
    );
  } catch (error) {
    res.status(statusCode.internalServerError).send(
      apiResponseErr(
        error.data ?? null,
        false,
        error.responseCode ?? statusCode.internalServerError,
        error.errMessage ?? error.message,
      ),
    );
  }
};
// done
export const getAnnouncementTypes = async (req, res) => {
  try {
    const announcementTypesData = await announcementSchema.findAll({
      attributes: ['announceId', 'typeOfAnnouncement'],
    });

    const announcementTypes = announcementTypesData.map((announcement) => ({
      announceId: announcement.announceId,
      typeOfAnnouncement: announcement.typeOfAnnouncement,
    }));

    res.status(statusCode.success).send(apiResponseSuccess(announcementTypes, true, statusCode.success, 'Success'));
  } catch (error) {
    res.status(statusCode.internalServerError).send(
      apiResponseErr(
        error.data ?? null,
        false,
        error.responseCode ?? statusCode.internalServerError,
        error.errMessage ?? error.message,
      ),
    );
  }
};