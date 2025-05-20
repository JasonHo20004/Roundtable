// backend/daos/user-message-details.dao.js
import {postgresInstance} from '#db/postgres.js';
import UserMessageDetails from '#models/user-message-details.model.js';

/**
 * @typedef {Object} GetDetailedMessagesOptions
 * @property {number} [limit=50] - Max number of messages to return.
 * @property {number} [offset=0] - Number of messages to skip.
 * @property {'asc'|'desc'} [order='desc'] - Sort order by messageCreatedAt. Default is desc (newest first).
 * @property {string} [requestingPrincipalId] - The Principal ID of the user making the request (used for filtering deleted).
 */

/**
 * DAO for interacting with the "UserMessageDetails" database VIEW.
 */
class UserMessageDetailsDAO {
    constructor() {
        this.viewName = 'UserMessageDetails'; // Ensure this matches your actual VIEW name in the DB
    }
    /**
     * Fetches a single detailed message by its ID from the "UserMessageDetails" view.
     * @param {string} messageId - The UUID of the message.
     * @returns {Promise<UserMessageDetails | null>} - A promise resolving to a UserMessageDetails instance or null if not found.
     * @throws {Error} For database errors.
     */
    async getByMessageId(messageId) {
        if (!messageId) {
            console.warn('[UserMessageDetailsDAO] getByMessageId called without messageId');
            return null;
        }
        try {
            const viewRow = await postgresInstance(this.viewName)
                .where({messageId: messageId}) // "messageId" is a column in the view
                .first();
            return UserMessageDetails.fromDbRow(viewRow);
        } catch (error) {
            console.error(`[UserMessageDetailsDAO] Error fetching by messageId (${messageId}):`, error);
            throw error;
        }
    }

    /**
     * Fetches detailed messages exchanged between two specific principals.
     * Filters messages based on the requesting principal's perspective (deleted flags).
     * The UserMessageDetails view provides senderPrincipalId and recipientPrincipalId.
     * @param {string} principalId1 - The Principal UUID of the first participant.
     * @param {string} principalId2 - The Principal UUID of the second participant.
     * @param {GetDetailedMessagesOptions} [options={}] - Options for pagination and filtering. Requires requestingPrincipalId.
     * @returns {Promise<UserMessageDetails[]>} - A promise resolving to an array of UserMessageDetails instances.
     * @throws {Error} For database errors or if requestingPrincipalId is missing.
     */
    async getMessagesBetweenUsers(principalId1, principalId2, options = {}) {
        if (!principalId1 || !principalId2) {
            console.error('[UserMessageDetailsDAO] getMessagesBetweenPrincipals requires two principal IDs.');
            return [];
        }
        const {limit = 50, offset = 0, order = 'desc', requestingPrincipalId} = options;

        if (!requestingPrincipalId) {
            throw new Error('[UserMessageDetailsDAO] requestingPrincipalId is required in options for getMessagesBetweenPrincipals.');
        }

        const validOrder = ['asc', 'desc'].includes(order?.toLowerCase()) ? order.toLowerCase() : 'desc';

        try {
            const query = postgresInstance(this.viewName)
                .where(function () {
                    // Messages involving both principals
                    this.where(builder => builder.where('senderPrincipalId', principalId1).andWhere('recipientPrincipalId', principalId2))
                        .orWhere(builder => builder.where('senderPrincipalId', principalId2).andWhere('recipientPrincipalId', principalId1));
                })
                .andWhere(function () {
                    this.where(function () {
                        this.where('senderPrincipalId', requestingPrincipalId).andWhere('senderDeleted', false);
                    }).orWhere(function () {
                        this.where('recipientPrincipalId', requestingPrincipalId).andWhere('recipientDeleted', false);
                    });
                })
                .orderBy('messageCreatedAt', validOrder)
                .limit(limit)
                .offset(offset);

            const viewRows = await query;

            return viewRows.map(row => UserMessageDetails.fromDbRow(row)).filter(details => details !== null);

        } catch (error) {
            console.error(`[UserMessageDetailsDAO] Error fetching messages between principals (${principalId1}, ${principalId2}):`, error);
            throw error;
        }
    }
}

export default new UserMessageDetailsDAO();