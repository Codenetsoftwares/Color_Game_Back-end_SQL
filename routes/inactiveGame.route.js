import { string } from '../constructor/string.js';
import { getInactiveGames } from '../controller/inactiveGame.controller.js';
import { authorize } from '../middleware/auth.js';

export const InactiveGameRoute = (app) => {
  app.get('/api/inactive-games', authorize([string.Admin]), getInactiveGames);
};
