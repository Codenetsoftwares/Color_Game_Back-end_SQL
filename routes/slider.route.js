import { authorize } from '../middleware/auth.js';
import { errorHandler } from '../middleware/ErrorHandling.js';
import customErrorHandler from '../middleware/customErrorHandler.js';
import {
  createSlider,
  activeSlider,
  updateSliderImage,
  createGif,
  deleteGifData,
  getSliderTextImg,
} from '../controller/slider.controller.js';
import { string } from '../constructor/string.js';

export const SliderRoute = (app) => {
  // done
  app.post('/api/admin/slider-text-img/dynamic', customErrorHandler, authorize([string.Admin]), createSlider);
  // done
  app.get('/api/admin/slider-text-img', customErrorHandler, getSliderTextImg);
  // done
  app.post('/api/admin/active-slider/:imageId', customErrorHandler, activeSlider);
  // done
  app.put('/api/admin/update-slider-img/:imageId', customErrorHandler, updateSliderImage);
  // done
  app.post('/api/admin/gif-dynamic', customErrorHandler, errorHandler, authorize([string.Admin]), createGif);
  // done
  app.delete('/api/delete/gif/:imageId', customErrorHandler, authorize([string.Admin]), deleteGifData);
};
