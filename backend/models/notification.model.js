// models/notification.model.js

/**
 * @typedef {'comment_reply'|'post_reply'|'mention'|'message'|'moderator_invite'|'system_message'|'report_update'|'vote_post'|'vote_comment'} NotificationTypeEnum
 * Represents the type of notification, mirroring the "NotificationType" ENUM in the database.
 */
export const NotificationTypeEnum = Object.freeze(
    {
        COMMENT_REPLY: 'comment_reply',
        POST_REPLY: 'post_reply',
        MENTION: 'mention',
        MESSAGE: 'message',
        MODERATOR_INVITE: 'moderator_invite',
        SYSTEM_MESSAGE: 'system_message',
        REPORT_UPDATE: 'report_update',
    }
);

/**
 * Represents a Notification sent to a user.
 */
class Notification {
    /**
     * Creates an instance of Notification.
     * @param {string | null} notificationId - The unique identifier (UUID), null if new.
     * @param {string} recipientUserId - The UUID of the RegisteredUser receiving the notification. Required.
     * @param {string | null} triggeringPrincipalId - The UUID of the Principal who triggered the notification (null if system/deleted user/etc.).
     * @param {NotificationTypeEnum} type - The type of the notification, corresponding to the "NotificationType" ENUM. Required.
     * @param {string | null} [sourceUrl=null] - Optional URL linking to the source of the notification (e.g., post, comment).
     * @param {string | null} [content=null] - Optional brief content preview or message text.
     * @param {boolean} [isRead=false] - Whether the recipient has marked the notification as read.
     * @param {Date | null} [createdAt=null] - Timestamp of creation (set by DB default).
     */
    constructor(notificationId, recipientUserId, triggeringPrincipalId, type, sourceUrl = null, content = null, isRead = false, createdAt = null) {
        /** @type {string | null} */
        this.notificationId = notificationId;

        /** @type {string} */
        this.recipientUserId = recipientUserId;

        /** @type {string | null} */
        this.triggeringPrincipalId = triggeringPrincipalId;

        /** @type {NotificationTypeEnum} */
        this.type = type;

        /** @type {string | null} */
        this.sourceUrl = sourceUrl;

        /** @type {string | null} */
        this.content = content;

        /** @type {boolean} */
        this.isRead = isRead;

        /** @type {Date | null} */
        this.createdAt = createdAt ? new Date(createdAt) : null; // Ensure Date object
    }

    /**
     * Converts a database row object into a Notification instance.
     * Assumes the DB row contains a 'recipientUserId' column now.
     * @param {Object} row - The database row object corresponding to the "Notification" table or a relevant view.
     * @returns {Notification | null} A Notification instance or null if no row provided.
     */
    static fromDbRow(row) {
        if (!row) return null;
        return new Notification(
            row.notificationId,
            row.recipientUserId, // <-- Changed from row.recipientAccountId
            row.triggeringPrincipalId,
            row.type,
            row.sourceUrl,
            row.content,
            row.isRead,
            row.createdAt ? new Date(row.createdAt) : null
        );
    }
}

export default Notification;