// backend/daos/notification.dao.js
import {postgresInstance} from '#db/postgres.js';
import Notification from '#models/notification.model.js';

class NotificationDAO {
    constructor() {
        this.tableName = 'Notification';
    }

    /**
     * Finds a notification by its unique ID (UUID).
     * @param {string} notificationId - The UUID of the notification.
     * @param {import('knex').Knex.Transaction | null} [trx=null] - Optional transaction object.
     * @returns {Promise<Notification | null>} The Notification instance or null if not found.
     * @throws {Error} For database errors.
     */
    async getById(notificationId, trx = null) {
        const queryBuilder = trx || postgresInstance;
        try {
            const notificationRow = await queryBuilder(this.tableName).where({notificationId}).first();
            return Notification.fromDbRow(notificationRow);
        } catch (error) {
            console.error(`[NotificationDAO] Error finding notification by ID (${notificationId}):`, error);
            throw error;
        }
    }

    /**
     * Creates a new notification record in the database.
     * @param {Notification} notification - The Notification instance to create (notificationId and createdAt are ignored/handled by DB).
     * @param {import('knex').Knex.Transaction | null} [trx=null] - Optional Knex transaction object.
     * @returns {Promise<Notification>} The newly created Notification instance with DB-generated values.
     * @throws {Error} For database errors (e.g., constraint violations).
     */
    async create(notification, trx = null) {
        const queryBuilder = trx || postgresInstance;
        const {notificationId, createdAt, ...insertData} = notification;

        // Basic check in DAO - Service layer should ensure required fields are present before calling
        if (!insertData.recipientUserId || !insertData.type) {
            throw new Error('[NotificationDAO] Missing required fields for creation: recipientUserId and type.');
        }

        try {
            const insertedRows = await queryBuilder(this.tableName).insert(insertData).returning('*');
            if (!insertedRows || insertedRows.length === 0) {
                throw new Error('Notification creation in DAO failed: No data returned.');
            }
            return Notification.fromDbRow(insertedRows[0]);
        } catch (error) {
            console.error('[NotificationDAO] Error creating notification:', error);
            // Example: Handle foreign key violation if recipientUserId doesn't exist
            // if (error.code === '23503' && error.constraint === 'notification_recipientuserid_fkey') {
            //     throw new Error(`Recipient user with ID ${insertData.recipientUserId} does not exist.`);
            // }
            throw error;
        }
    }

    /**
     * Updates an existing notification, primarily to mark it as read/unread.
     * @param {string} notificationId - The ID of the notification to update.
     * @param {Partial<Pick<Notification, 'isRead'>>} updateData - An object containing fields to update (currently only 'isRead').
     * @param {import('knex').Knex.Transaction | null} [trx=null] - Optional Knex transaction object.
     * @returns {Promise<Notification | null>} The updated Notification instance, or null if not found or no rows updated.
     * @throws {Error} For database errors.
     */
    async update(notificationId, updateData, trx = null) {
        const queryBuilder = trx || postgresInstance;
        const allowedUpdates = {};
        if (updateData.isRead !== undefined) {
            allowedUpdates.isRead = !!updateData.isRead; // Ensure boolean
        }

        if (Object.keys(allowedUpdates).length === 0) {
            console.warn(`[NotificationDAO] Update called for ID ${notificationId} with no valid fields.`);
            return this.getById(notificationId, trx); // Return current state
        }

        try {
            const updatedRows = await queryBuilder(this.tableName)
                .where({notificationId})
                .update(allowedUpdates)
                .returning('*');

            if (!updatedRows || updatedRows.length === 0) {
                return null; // Not found or already had the target state
            }
            return Notification.fromDbRow(updatedRows[0]);
        } catch (error) {
            console.error(`[NotificationDAO] Error updating notification (${notificationId}):`, error);
            throw error;
        }
    }

    /**
     * Finds notifications for a specific recipient account, optionally paginated, filtered, and sorted.
     * @param {string} recipientUserId - The UUID of the recipient account.
     * @param {object} [options={}] - Options for pagination, filtering, and sorting.
     * @param {number} [options.limit=25] - Max notifications per page.
     * @param {number} [options.offset=0] - Notifications to skip.
     * @param {boolean} [options.isRead] - Filter by read status (true, false, or undefined for all).
     * @param {'createdAt'} [options.sortBy='createdAt'] - Field to sort by.
     * @param {'asc'|'desc'} [options.order='desc'] - Sort order.
     * @returns {Promise<Notification[]>} An array of Notification instances.
     * @throws {Error} For database errors.
     */
    async getByRecipient(recipientUserId, options = {}) {
        const {limit = 25, offset = 0, isRead, sortBy = 'createdAt', order = 'desc'} = options;
        const validSortBy = sortBy === 'createdAt' ? sortBy : 'createdAt'; // Only reliable sort field
        const validOrder = ['asc', 'desc'].includes(order) ? order : 'desc';

        try {
            const query = postgresInstance(this.tableName).where({recipientUserId});

            if (isRead !== undefined) {
                query.andWhere({isRead: !!isRead}); // Ensure boolean
            }

            query.orderBy(validSortBy, validOrder).limit(limit).offset(offset);

            const notificationRows = await query;
            return notificationRows.map(Notification.fromDbRow);
        } catch (error) {
            console.error(`[NotificationDAO] Error finding notifications by recipient (${recipientUserId}):`, error);
            throw error;
        }
    }

    /**
     * Counts notifications for a specific recipient, optionally filtered by read status.
     * @param {string} recipientUserId - The ID of the recipient user.
     * @param {object} [filters={}] - Optional filters for counting.
     * @param {boolean} [filters.isRead] - Filter by read status.
     * @returns {Promise<number>} The count of notifications matching the criteria.
     * @throws {Error} For database errors.
     */
    async countByRecipient(recipientUserId, filters = {}) {
        const {isRead} = filters;
        try {
            const query = postgresInstance(this.tableName).where({recipientUserId});

            if (isRead !== undefined) {
                query.andWhere({isRead: !!isRead});
            }
            const result = await query.count({count: '*'}).first();
            return parseInt(result?.count, 10) || 0;
        } catch (error) {
            console.error(`[NotificationDAO] Error counting notifications for recipient (${recipientUserId}):`, error);
            throw error;
        }
    }

    /**
     * Marks multiple notifications as read for a specific recipient.
     * @param {string} recipientUserId - The ID of the user owning the notifications.
     * @param {string[]} notificationIds - An array of notification IDs to mark as read.
     * @param {import('knex').Knex.Transaction | null} [trx=null] - Optional Knex transaction object.
     * @returns {Promise<number>} The number of notifications actually updated (marked as read).
     * @throws {Error} For database errors.
     */
    async markAsRead(recipientUserId, notificationIds, trx = null) {
        if (!recipientUserId || !notificationIds || notificationIds.length === 0) {
            return 0; // Nothing to update
        }
        const queryBuilder = trx || postgresInstance;
        try {
            // Update only if owned by the user and currently unread
            return await queryBuilder(this.tableName)
                .where({recipientUserId: recipientUserId, isRead: false})
                .whereIn('notificationId', notificationIds)
                .update({isRead: true});
        } catch (error) {
            console.error(`[NotificationDAO] Error marking notifications as read for user ${recipientUserId}:`, error);
            throw error;
        }
    }

    /**
     * Marks ALL unread notifications as read for a specific recipient.
     * @param {string} recipientUserId - The UUID of the recipient user.
     * @param {import('knex').Knex.Transaction | null} [trx=null] - Optional Knex transaction object.
     * @returns {Promise<number>} The number of notifications updated.
     * @throws {Error} For database errors.
     */
    async markAllAsRead(recipientUserId, trx = null) {
        if (!recipientUserId) {
            return 0;
        }
        const queryBuilder = trx || postgresInstance;
        try {
            return await queryBuilder(this.tableName)
                .where({recipientUserId: recipientUserId, isRead: false})
                .update({isRead: true});
        } catch (error) {
            console.error(`[NotificationDAO] Error marking all notifications as read for recipient (${recipientUserId}):`, error);
            throw error;
        }
    }
}

export default new NotificationDAO();