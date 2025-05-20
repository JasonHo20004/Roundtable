// backend/routes/notification.routes.js
import express from 'express';
import NotificationController from '#controllers/notification.controller.js';
import {isAuthenticated} from '#middlewares/auth.mdw.js';

const router = express.Router();

// Apply isAuthenticated to all routes in this file
router.use(isAuthenticated);

// Define routes
router.get('/', NotificationController.getUserNotifications);
router.get('/count', NotificationController.getUnreadNotificationCount);
router.post('/:notificationId/read', NotificationController.markNotificationAsRead);


export default router;