import { Authorize } from "../middleware/auth.js";
import { errorHandler } from "../middleware/ErrorHandling.js";
import customErrorHandler from "../middleware/customErrorHandler.js";
import {
  createSlider,
  activeSlider,
  updateSliderImage,
  createGif,
  deleteGifData,
  getSliderTextImg,
} from "../controller/slider.controller.js";

export const SliderRoute = (app) => {
  app.post(
    "/api/admin/slider-text-img/dynamic",
    customErrorHandler,
    Authorize(["Admin"]),
    createSlider
  );

  app.get("/api/admin/slider-text-img", customErrorHandler, getSliderTextImg);

  app.post(
    "/api/admin/active-slider/:imageId",
    customErrorHandler,
    activeSlider
  );

  app.put(
    "/api/admin/update-slider-img/:imageId",
    customErrorHandler,
    updateSliderImage
  );

  app.post(
    "/api/admin/gif-dynamic",
    customErrorHandler,
    errorHandler,
    Authorize(["Admin"]),
    createGif
  );

  app.delete(
    "/api/delete/gif/:imageId",
    customErrorHandler,
    Authorize(["Admin"]),
    deleteGifData
  );
};
