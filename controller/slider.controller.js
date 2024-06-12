import { database } from "./database.controller.js";
import awsS3Obj from "../helper/awsS3.js";
import { v4 as uuidv4 } from "uuid";
import {
  apiResponseSuccess,
  apiResponseErr,
} from "../middleware/serverError.js";
// Done
export const createSlider = async (req, res) => {
  const { sliderCount, data } = req.body;
  try {
    if (!Array.isArray(data))
      return res
        .status(400)
        .send(apiResponseErr(null, false, 400, "Data must be an array"));

    let documentArray = [];

    for (const element of data) {
      let obj = {};
      const result = await awsS3Obj.addDocumentToS3(
        element.docBase,
        element.name,
        "game-slider",
        element.doctype
      );
      obj.imageId = uuidv4();
      obj.image = result.Location;
      obj.text = element.text;
      obj.headingText = element.headingText;
      obj.isActive = element.isActive ?? 1;
      documentArray.push(obj);
    }
    for (const doc of documentArray) {
      await database.execute(
        `INSERT INTO Gif (imageId, image, text, headingText, isActive)
                            VALUES (?, ?, ?, ?, ?)`,
        [doc.imageId, doc.image, doc.text, doc.headingText, doc.isActive]
      );
    }
    for (const doc of documentArray) {
      await database.execute(
        `INSERT INTO Slider (sliderCount, imageId, image, text, headingText, isActive)
                            VALUES (?, ?, ?, ?, ?, ?)`,
        [
          sliderCount,
          doc.imageId,
          doc.image,
          doc.text,
          doc.headingText,
          doc.isActive,
        ]
      );
    }

    console.log("Slider documents inserted into the database.");
    const [rows] = await database.execute(
      `SELECT * FROM Slider WHERE sliderCount = ?`,
      [sliderCount]
    );
    const insertedSliders = rows;

    return res
      .status(statusCode.create)
      .send(
        apiResponseSuccess(
          insertedSliders,
          true,
          statusCode.create,
          "Slider created successfully."
        )
      );
  } catch (error) {
    res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          error.data ?? null,
          false,
          error.responseCode ?? statusCode.internalServerError,
          error.errMessage ?? error.message
        )
      );
  }
};
//  Done

export const getSliderTextImg = async (req, res) => {
  try {
    const [rows] = await database.execute(
      "SELECT imageId, image, text, headingText, isActive FROM Slider"
    );
    return res.status(statusCode.success).send(apiResponseSuccess(rows, true, statusCode.success, "success"));
  } catch (error) {
    return res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          error.data ?? null,
          false,
          error.responseCode ?? statusCode.internalServerError,
          error.errMessage ?? error.message
        )
      );
  }
};
// Done
export const activeSlider = async (req, res) => {
  const { isActive } = req.body;
  const { imageId } = req.params;

  try {
    const [updateResult] = await database.execute(
      "UPDATE Slider SET isActive = ? WHERE imageId = ?",
      [isActive, imageId]
    );

    if (updateResult.affectedRows === 0) {
      return res
        .status(statusCode.notFound)
        .send(apiResponseErr(null, false, statusCode.notFound, "Image not found"));
    }
    const [sliderData] = await database.execute(
      "SELECT * FROM Slider WHERE imageId = ?",
      [imageId]
    );

    return res
      .status(statusCode.success)
      .send(apiResponseSuccess(sliderData, true, statusCode.success, "success"));
  } catch (error) {
    return res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          error.data ?? null,
          false,
          error.responseCode ?? statusCode.internalServerError,
          error.errMessage ?? error.message
        )
      );
  }
};

// Done
export const updateSliderImage = async (req, res) => {
  const { imageId } = req.params;
  const data = req.body;

  try {
    await database.execute(
      "UPDATE Slider SET image = ?, text = ?, headingText = ? WHERE imageId = ?",
      [data.image, data.text, data.headingText, imageId]
    );
    const [rows] = await database.execute(
      "SELECT * FROM Slider WHERE imageId = ?",
      [imageId]
    );
    const updatedSlider = rows[0];

    return res
      .status(statusCode.success)
      .send(apiResponseSuccess(updatedSlider, true, statusCode.success, "success"));
  } catch (error) {
    return res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          error.data ?? null,
          false,
          error.responseCode ?? statusCode.internalServerError,
          error.errMessage ?? error.message
        )
      );
  }
};
// Done
export const createGif = async (req, res) => {
  const { document } = req.body;

  try {
    if (!Array.isArray(document))
      return res
        .status(400)
        .send(apiResponseErr(null, false, 400, "Data must be an array"));

    const sqlInsert = `
      INSERT INTO Gif (imageId, image, text, headingText, isActive)
      VALUES (?, ?, ?, ?, ?)
    `;
    const insertValues = [];

    for (const element of document) {
      const imageId = uuidv4();
      const { Location: imageUrl } = await awsS3Obj.addDocumentToS3(
        element.docBase,
        element.name,
        "gif-slider",
        element.doctype
      );
      insertValues.push([
        imageId,
        imageUrl,
        element.text,
        element.headingText,
        element.isActive ?? true,
      ]);
    }
    const flattenedValues = insertValues.flat();
    await database.execute(sqlInsert, flattenedValues);
    const insertedImageIds = insertValues.map(([imageId]) => imageId);
    const [rows] = await database.execute(
      `SELECT * FROM Gif WHERE imageId IN (${insertedImageIds.map(() => "?").join(", ")})`,
      insertedImageIds
    );
    const insertedData = rows;

    return res
      .status(statusCode.create)
      .send(
        apiResponseSuccess(insertedData, true, statusCode.create, "Create Gif Successfully")
      );
  } catch (error) {
    return res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          error.data ?? null,
          false,
          error.responseCode ?? statusCode.internalServerError,
          error.errMessage ?? error.message
        )
      );
  }
};

// Done
export const deleteGifData = async (req, res) => {
  const { imageId } = req.params;

  try {
    const selectQuery = "SELECT * FROM Gif WHERE imageId = ?";
    const [rows] = await database.execute(selectQuery, [imageId]);
    const gifData = rows[0];

    if (!gifData)
      return res
        .status(statusCode.notFound)
        .send(apiResponseErr(null, false, statusCode.notFound, "Gif not found"));

    const deleteQuery = "DELETE FROM Gif WHERE imageId = ?";
    await database.execute(deleteQuery, [imageId]);

    return res
      .status(statusCode.create)
      .send(apiResponseSuccess(gifData, true, statusCode.create, "Delete Gif Successfully"));
  } catch (error) {
    return res
      .status(statusCode.internalServerError)
      .send(
        apiResponseErr(
          error.data ?? null,
          false,
          error.responseCode ?? statusCode.internalServerError,
          error.errMessage ?? error.message
        )
      );
  }
};
