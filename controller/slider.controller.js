import awsS3Obj from '../helper/awsS3.js';
import { v4 as uuidv4 } from 'uuid';
import { apiResponseSuccess, apiResponseErr } from '../middleware/serverError.js';
import sliderSchema from '../models/slider.model.js';
import { statusCode } from '../helper/statusCodes.js';
import gifSchema from '../models/gif.model.js';

// Done
export const createSlider = async (req, res) => {
  const { sliderCount, data } = req.body;
  try {
    if (!Array.isArray(data)) {
      return res.status(400).send(apiResponseErr(null, false, 400, 'Data must be an array'));
    }

    let sliderArray = [];

    for (const element of data) {
      const result = await awsS3Obj.addDocumentToS3(element.docBase, element.name, 'game-slider', element.doctype);
      const slider = {
        imageId: uuidv4(),
        image: result.Location,
        text: element.text,
        headingText: element.headingText,
        isActive: element.isActive ?? true,
        sliderCount: parseInt(sliderCount),
      };
      sliderArray.push(slider);
    }

    const createdSliders = await sliderSchema.bulkCreate(sliderArray);

    console.log('Slider documents inserted into the database.');

    return res
      .status(statusCode.create)
      .send(apiResponseSuccess(createdSliders, true, statusCode.create, 'Slider created successfully.'));
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

//  Done
export const getSliderTextImg = async (req, res) => {
  try {
    const sliders = await sliderSchema.findAll({
      attributes: ['imageId', 'image', 'text', 'headingText', 'isActive'],
    });

    return res.status(statusCode.success).send(apiResponseSuccess(sliders, true, statusCode.success, 'Success'));
  } catch (error) {
    return res
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

// Done
export const activeSlider = async (req, res) => {
  try {
    const { isActive } = req.body;
    const { imageId } = req.params;

    const sliderData = await sliderSchema.findOne({
      where: { imageId },
    });

    if (!sliderData) {
      return res.status(statusCode.notFound).send(apiResponseErr(null, false, statusCode.notFound, 'Image not found'));
    }

    sliderData.update({ isActive });

    return res
      .status(statusCode.success)
      .send(apiResponseSuccess(sliderData, true, statusCode.success, 'Slider status updated successfully'));
  } catch (error) {
    return res
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

// Done
export const updateSliderImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const data = req.body;
    const slider = await sliderSchema.findOne({
      where: { imageId },
    });
    if (!slider) {
      return res.status(statusCode.notFound).send(apiResponseErr(null, false, statusCode.notFound, 'Image not found'));
    }

    slider.image = data.image || slider.image;
    slider.text = data.text || slider.text;
    slider.headingText = data.headingText || slider.headingText;
    const updatedSlider = await slider.save();

    return res
      .status(statusCode.success)
      .send(apiResponseSuccess(updatedSlider, true, statusCode.success, 'Slider updated successfully'));
  } catch (error) {
    return res
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

// Done
export const createGif = async (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).send(apiResponseErr(null, false, 400, 'Data must be an array'));
    }

    let sliderArray = [];

    for (const element of data) {
      const result = await awsS3Obj.addDocumentToS3(element.docBase, element.name, 'gif-slider', element.doctype);
      const slider = {
        imageId: uuidv4(),
        image: result.Location,
        text: element.text,
        headingText: element.headingText,
        isActive: element.isActive ?? true,
      };
      sliderArray.push(slider);
    }

    const createdSliders = await gifSchema.bulkCreate(sliderArray);

    console.log('Gif documents inserted into the database.');

    return res
      .status(statusCode.create)
      .send(apiResponseSuccess(createdSliders, true, statusCode.create, 'Gif created successfully.'));
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

// Done
export const deleteGifData = async (req, res) => {
  const { imageId } = req.params;

  try {
    const gifData = await gifSchema.findOne({
      where: {
        imageId: imageId,
      },
    });

    if (!gifData) {
      return res.status(statusCode.notFound).send(apiResponseErr(null, false, statusCode.notFound, 'Gif not found'));
    }

    await gifSchema.destroy({
      where: {
        imageId: imageId,
      },
    });

    return res
      .status(statusCode.success)
      .send(apiResponseSuccess(gifData, true, statusCode.success, 'Delete Gif Successfully'));
  } catch (error) {
    console.error('Error in deleteGifData:', error);
    return res
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
