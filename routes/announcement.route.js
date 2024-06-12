import { announcements, getAnnouncement, updateAnnouncement } from '../controller/announcement.controller.js';
import { authorize } from '../middleware/auth.js';
import customErrorHandler from '../middleware/customErrorHandler.js';
import { announcementsSchema, updateAnnouncementSchema, } from '../schema/commonSchema.js';

export const AnnouncementRoute = (app) => {
// done
app.post('/api/admin/announcements-create', announcementsSchema, customErrorHandler, authorize(['Admin']), announcements);
// done
app.get('/api/admin/announcements-latest/:announceId', customErrorHandler, getAnnouncement);
// done
app.put('/api/admin/update-announcement/:announceId', updateAnnouncementSchema, customErrorHandler, authorize(['Admin']), updateAnnouncement);

}