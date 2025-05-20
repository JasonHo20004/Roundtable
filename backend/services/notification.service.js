// backend/services/notification.service.js
import NotificationDAO from '#daos/notification.dao.js';
import UserPostDetailsDAO from "#daos/user-post-details.dao.js"; // Used for comment notifications
import UserProfileDAO from "#daos/user-profile.dao.js"; // Used for user checks & triggerer info
import Notification, {NotificationTypeEnum} from '#models/notification.model.js';
import {postgresInstance} from "#db/postgres.js";
import EventBus from '#core/event-bus.js';
import {AppError, BadRequestError, ForbiddenError, InternalServerError, NotFoundError} from "#errors/AppError.js";

class NotificationService {
    /**
     * Constructor for NotificationService.
     * Inject dependencies for better testability.
     * @param {NotificationDAO} notificationDao - DAO for notifications.
     * @param {UserPostDetailsDAO} userPostDetailsDao - DAO for post details view.
     * @param {UserProfileDAO} userProfileDao - DAO for user profiles view.
     * @param {EventBus} eventBus - System event bus.
     */
    constructor(notificationDao, userPostDetailsDao, userProfileDao, eventBus) {
        this.notificationDao = notificationDao;
        this.userPostDetailsDao = userPostDetailsDao;
        this.userProfileDao = userProfileDao;
        this.eventBus = eventBus;
    }

    /**
     * Creates a DB notification when a comment or reply is added and triggers a real-time notification event.
     * This function is often called by CommentService or triggered by an event.
     * @param {object} createdComment - The newly created comment/reply object (e.g., from Comment.fromDbRow).
     * @param {string} commenterUserId - The ID of the user who made the comment/reply.
     * @returns {Promise<Notification|undefined>} The created notification object or undefined if no notification was needed/sent.
     * @throws {InternalServerError} If dependent data (post, users) cannot be fetched or DB operation fails.
     */
    async notifyNewCommentOrReply(createdComment, commenterUserId) {
        // Validate essential input
        if (!createdComment?.commentId || !createdComment.postId || !commenterUserId) {
            console.error('[NotificationService:notifyNewCommentOrReply] Invalid input:', {
                createdComment,
                commenterUserId
            });
            return undefined;
        }

        try {
            // 1. Get Post details to find owner and title
            const post = await this.userPostDetailsDao.getByPostId(createdComment.postId);
            if (!post?.author?.userId) {
                console.log(`[NotificationService:notifyNewCommentOrReply] Post (${createdComment.postId}) or author not found. No notification.`);
                return undefined;
            }
            const postOwnerUserId = post.author.userId;

            // 2. Determine recipient and notification type
            let recipientUserId = null;
            let notificationType;

            if (createdComment.parentCommentId) {
                // It's a reply, notify the parent comment author (if different from replier)
                notificationType = NotificationTypeEnum.COMMENT_REPLY;
                recipientUserId = createdComment.parentCommentId; // Default to notifying post owner for replies too for now

                if (postOwnerUserId !== commenterUserId) {
                    recipientUserId = postOwnerUserId; // Fallback to post owner
                } else {
                    recipientUserId = null; // Don't notify anyone
                }

            } else {
                // It's a top-level comment, notify the post owner (if different from commenter)
                notificationType = NotificationTypeEnum.POST_REPLY;
                if (postOwnerUserId !== commenterUserId) {
                    recipientUserId = postOwnerUserId;
                }
            }

            // 3. Don't notify if recipient is the commenter or no recipient determined
            if (!recipientUserId || recipientUserId === commenterUserId) {
                console.log(`[NotificationService:notifyNewCommentOrReply] No notification needed for comment ${createdComment.commentId}.`);
                return undefined;
            }

            // 4. Get commenter's profile to find their principalId
            const commenterProfile = await this.userProfileDao.getByUserId(commenterUserId);
            const triggeringPrincipalId = commenterProfile?.principalId || null;

            // 5. Prepare notification details
            const sourceUrl = `/posts/${createdComment.postId}#comment-${createdComment.commentId}`;
            const commenterName = commenterProfile?.displayName || commenterProfile?.username || 'Someone';
            const postTitleSnippet = post.title ? `"${post.title.substring(0, 30)}..."` : "your post";
            let content = '';
            if (notificationType === NotificationTypeEnum.COMMENT_REPLY) {
                content = `${commenterName} replied to your comment on ${postTitleSnippet}`;
                // TODO: Adjust content if notifying parent comment author vs post author
            } else {
                content = `${commenterName} commented on ${postTitleSnippet}`;
            }

            // 6. Create Notification DB Record
            const notification = new Notification(
                null, recipientUserId, triggeringPrincipalId, notificationType,
                sourceUrl, content, false, null
            );

            // Use DAO within a transaction for atomicity (optional but good practice)
            const createdNotification = await postgresInstance.transaction(async (trx) => {
                return await this.notificationDao.create(notification, trx);
            });

            if (!createdNotification) {
                throw new InternalServerError("Failed to save notification record.");
            }

            // 7. Trigger the real-time event
            this.eventBus.emit('notification.created', {
                recipientUserId: recipientUserId,
                notification: createdNotification, // Send the full DB object
            });
            console.log(`[NotificationService:notifyNewCommentOrReply] Notified user ${recipientUserId} about comment ${createdComment.commentId}.`);

            return createdNotification;

        } catch (error) {
            console.error(`[NotificationService:notifyNewCommentOrReply] Error processing comment ${createdComment?.commentId}:`, error);
            if (error instanceof AppError) {
                throw error;
            }
            return undefined; // Indicate notification failed
        }
    }

    /**
     * Retrieves notifications for a specific user with pagination/filtering options.
     * @param {string} userId - The ID of the user whose notifications are being fetched.
     * @param {object} [options={}] - Options for filtering and pagination.
     * @param {number} [options.limit=25] - Max items per page.
     * @param {number} [options.offset=0] - Items to skip.
     * @param {boolean} [options.isRead] - Filter by read status.
     * @returns {Promise<{notifications: Notification[], totalCount: number}>} List of notifications and total count matching filters.
     * @throws {BadRequestError} If userId is missing.
     * @throws {InternalServerError} For database errors.
     */
    async getNotificationsForUser(userId, options = {}) {
        if (!userId) {
            throw new BadRequestError('User ID is required to fetch notifications.');
        }

        // Sanitize pagination options
        const limit = Math.max(1, parseInt(options.limit, 10) || 25);
        const offset = Math.max(0, parseInt(options.offset, 10) || 0);
        const filterOptions = {
            limit,
            offset,
            isRead: options.isRead === undefined ? undefined : options.isRead === 'true' || options.isRead === true, // Handle string/boolean
            sortBy: 'createdAt', // Default sort
            order: 'desc',      // Default order
        };

        try {
            // Fetch notifications and count using the DAO
            const notifications = await this.notificationDao.getByRecipient(userId, filterOptions);
            const totalCount = await this.notificationDao.countByRecipient(userId, {isRead: filterOptions.isRead});

            return {
                notifications,
                totalCount,
            };
        } catch (error) {
            console.error(`[NotificationService:getNotificationsForUser] Error for userId ${userId}:`, error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new InternalServerError('Failed to retrieve notifications.');
        }
    }

    /**
     * Gets the count of unread notifications for a user.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<number>} The count of unread notifications.
     * @throws {BadRequestError} If userId is missing.
     * @throws {InternalServerError} For database errors.
     */
    async getUnreadCountForUser(userId) {
        if (!userId) {
            throw new BadRequestError('User ID is required to fetch unread count.');
        }
        try {
            // Use DAO, specifically filtering for unread
            return await this.notificationDao.countByRecipient(userId, {isRead: false});
        } catch (error) {
            console.error(`[NotificationService:getUnreadCountForUser] Error for userId ${userId}:`, error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new InternalServerError('Failed to retrieve unread notification count.');
        }
    }

    /**
     * Marks a specific notification as read for a user, ensuring ownership.
     * @param {string} userId - The ID of the user attempting to mark the notification.
     * @param {string} notificationId - The ID of the notification to mark as read.
     * @returns {Promise<boolean>} True if the notification was marked as read (or was already read).
     * @throws {BadRequestError} If IDs are missing.
     * @throws {NotFoundError} If the notification doesn't exist.
     * @throws {ForbiddenError} If the user doesn't own the notification.
     * @throws {InternalServerError} For database errors.
     */
    async markNotificationAsRead(userId, notificationId) {
        if (!userId || !notificationId) {
            throw new BadRequestError('User ID and Notification ID are required.');
        }

        try {
            // Use transaction to ensure atomicity of check and update
            let markedAsRead = false;
            await postgresInstance.transaction(async (trx) => {
                // 1. Fetch notification to check ownership and current state
                const notification = await this.notificationDao.getById(notificationId, trx);
                if (!notification) {
                    throw new NotFoundError(`Notification with ID ${notificationId} not found.`);
                }
                if (notification.recipientUserId !== userId) {
                    throw new ForbiddenError('You do not have permission to modify this notification.');
                }

                // 2. Only update if it's currently unread
                if (!notification.isRead) {
                    const updatedCount = await this.notificationDao.markAsRead(userId, [notificationId], trx);
                    if (updatedCount === 0) {
                        // Should not happen if getById succeeded, but indicates potential race condition or issue
                        throw new InternalServerError(`Failed to mark notification ${notificationId} as read.`);
                    }
                    markedAsRead = true;
                } else {
                    markedAsRead = true; // Consider already read as success
                }
            }); // Commit transaction

            // Emit event only if status actually changed (or always emit on successful request?)
            // Let's emit if the operation succeeded (was already read or got marked read)
            if (markedAsRead) {
                this.eventBus.emit('notification.read', {
                    recipientUserId: userId,
                    notificationId: notificationId,
                });
            }
            return markedAsRead;

        } catch (error) {
            console.error(`[NotificationService:markNotificationAsRead] Error for user ${userId}, notification ${notificationId}:`, error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new InternalServerError('Failed to mark notification as read.');
        }
    }

    /**
     * Marks all unread notifications as read for a user.
     * @param {string} userId - The ID of the user whose notifications are being marked.
     * @returns {Promise<number>} The number of notifications marked as read.
     * @throws {BadRequestError} If userId is missing.
     * @throws {InternalServerError} For database errors.
     */
    async markAllNotificationsAsRead(userId) {
        if (!userId) {
            throw new BadRequestError('User ID is required.');
        }
        try {
            const updatedCount = await this.notificationDao.markAllAsRead(userId);

            if (updatedCount > 0) {
                this.eventBus.emit('notifications.read.all', {
                    recipientUserId: userId,
                    count: updatedCount,
                });
            }
            console.log(`[NotificationService:markAllNotificationsAsRead] Marked ${updatedCount} notifications as read for userId ${userId}`);
            return updatedCount; // Return the count

        } catch (error) {
            console.error(`[NotificationService:markAllNotificationsAsRead] Error for userId ${userId}:`, error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new InternalServerError('Failed to mark all notifications as read.');
        }
    }
}

// Inject dependencies
export default new NotificationService(
    NotificationDAO,
    UserPostDetailsDAO,
    UserProfileDAO,
    EventBus
);