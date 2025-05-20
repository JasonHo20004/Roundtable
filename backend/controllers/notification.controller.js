// backend/controllers/notification.controller.js
import HTTP_STATUS from "#constants/http-status.js";
import notificationService from "#services/notification.service.js";
import {BadRequestError, ForbiddenError, InternalServerError, NotFoundError} from "#errors/AppError.js";

class NotificationController {
    /**
     * @param {NotificationService} injectedNotificationService
     */
    constructor(injectedNotificationService) {
        this.notificationService = injectedNotificationService;
    }

    /**
     * Handles GET /notifications
     * Retrieves notifications for the authenticated user.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    getUserNotifications = async (req, res) => {
        const {userId} = req.session; // Assumes isAuthenticated middleware ran

        // Sanitize query parameters (Service layer now handles defaults and parsing)
        const options = {
            limit: req.query.limit,
            offset: req.query.offset,
            isRead: req.query.isRead, // Pass raw value, service validates/parses
        };

        // Redundant check if middleware is used, but safe
        if (!userId) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({success: false, message: 'Authentication required.'});
        }

        try {
            const result = await this.notificationService.getNotificationsForUser(userId, options);

            return res.status(HTTP_STATUS.OK).json({
                success: true,
                data: result, // Contains { notifications: [], totalCount: number }
            });

        } catch (error) {
            console.error(`[NotificationController:getUserNotifications] Error for userId ${userId}:`, error.message);
            if (error instanceof BadRequestError) { // e.g., invalid query params from service validation
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            // Fallback for unexpected errors
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred while fetching notifications.'
            });
        }
    }

    /**
     * Handles GET /notifications/count
     * Retrieves the count of unread notifications for the authenticated user.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    getUnreadNotificationCount = async (req, res) => {
        const {userId} = req.session;

        if (!userId) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({success: false, message: 'Authentication required.'});
        }

        try {
            const count = await this.notificationService.getUnreadCountForUser(userId);

            return res.status(HTTP_STATUS.OK).json({
                success: true,
                data: {unreadCount: count},
            });

        } catch (error) {
            console.error(`[NotificationController:getUnreadNotificationCount] Error for userId ${userId}:`, error.message);
            if (error instanceof BadRequestError) { // Should not happen if userId is from session
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred while fetching unread notification count.'
            });
        }
    }

    /**
     * Handles POST /notifications/:notificationId/read
     * Marks a specific notification as read for the authenticated user.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    markNotificationAsRead = async (req, res) => {
        const {userId} = req.session;
        const {notificationId} = req.params;

        if (!userId) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({success: false, message: 'Authentication required.'});
        }
        // Basic check for notificationId presence, service does more validation
        if (!notificationId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: 'Notification ID is required.'});
        }

        try {
            await this.notificationService.markNotificationAsRead(userId, notificationId);

            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Notification marked as read.',
            });

        } catch (error) {
            console.error(`[NotificationController:markNotificationAsRead] Error for user ${userId}, notification ${notificationId}:`, error.message);
            if (error instanceof NotFoundError) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: error.message});
            }
            if (error instanceof ForbiddenError) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({success: false, message: error.message});
            }
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred while marking the notification as read.'
            });
        }
    }

    /**
     * Handles POST /notifications/read-all (Example Route)
     * Marks all unread notifications as read for the authenticated user.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    // markAllNotificationsAsRead = async (req, res) => {
    //     const { userId } = req.session;
    //     if (!userId) { /* Unauthorized */ }
    //     try {
    //         const count = await this.notificationService.markAllNotificationsAsRead(userId);
    //         return res.status(HTTP_STATUS.OK).json({
    //             success: true,
    //             message: `${count} notifications marked as read.`,
    //             data: { count }
    //         });
    //     } catch (error) {
    //         // Handle BadRequestError, InternalServerError
    //     }
    // }
}

export default new NotificationController(notificationService); // Inject service