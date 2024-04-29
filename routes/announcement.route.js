import { announcements, getAnnouncement, updateAnnouncement } from '../controller/announcement.controller.js';
import { Authorize } from '../middleware/auth.js';
import customErrorHandler from '../middleware/customErrorHandler.js';
import { announcementsSchema, updateAnnouncementSchema, } from '../schema/commonSchema.js';

export const AnnouncementRoute = (app) => {
// DONE
app.post('/api/admin/announcements-create', announcementsSchema, customErrorHandler, Authorize(['Admin']), announcements);

app.get('/api/admin/announcements-latest/:announceId', customErrorHandler, getAnnouncement);

app.put('/api/admin/update-announcement/:announceId', updateAnnouncementSchema, customErrorHandler, Authorize(['Admin']), updateAnnouncement);

}