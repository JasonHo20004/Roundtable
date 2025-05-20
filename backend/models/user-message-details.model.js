// backend/models/user-message-details.model.js

import UserProfile from '#models/user-profile.model.js'; // Adjust path as needed
import {MessageTypeEnum} from '#models/message.model.js'; // Import enum

/**
 * @typedef {import('./message.model.js').MessageTypeEnum} MessageTypeEnum
 */

/**
 * Represents detailed information about a message, including sender and recipient profiles.
 * Mirrors the "UserMessageDetails" VIEW in the database.
 */
class UserMessageDetails {
    /**
     * Creates an instance of UserMessageDetails.
     * @param {string} messageId - The unique identifier for the message.
     * @param {string | null} parentMessageId - UUID of the message being replied to, null if not a reply.
     * @param {string} body - The content of the message.
     * @param {MessageTypeEnum} messageType - The type category of the message.
     * @param {Date | null} messageCreatedAt - Timestamp when the message was created.
     * @param {boolean} isRead - Flag indicating if the recipient has read the message.
     * @param {boolean} senderDeleted - Flag indicating if the sender has deleted the message.
     * @param {boolean} recipientDeleted - Flag indicating if the recipient has deleted the message.
     * @param {UserProfile | null} senderProfile - The UserProfile object for the sender (null if sender was deleted, is a system principal not in UserProfile, or message is system-sent without a defined sender).
     * @param {UserProfile | null} recipientProfile - The UserProfile object for the recipient (null if recipient was deleted or is a system principal not in UserProfile).
     */
    constructor(
        messageId, parentMessageId, body, messageType,
        messageCreatedAt, isRead, senderDeleted, recipientDeleted,
        senderProfile, recipientProfile
    ) {
        /** @type {string} */
        this.messageId = messageId;
        /** @type {string | null} */
        this.parentMessageId = parentMessageId;
        /** @type {string} */
        this.body = body;
        /** @type {MessageTypeEnum} */
        this.messageType = messageType;
        /** @type {Date | null} */
        this.messageCreatedAt = messageCreatedAt ? new Date(messageCreatedAt) : null;
        /** @type {boolean} */
        this.isRead = isRead;
        /** @type {boolean} */
        this.senderDeleted = senderDeleted;
        /** @type {boolean} */
        this.recipientDeleted = recipientDeleted;
        /** @type {UserProfile | null} */
        this.senderProfile = senderProfile;
        /** @type {UserProfile | null} */
        this.recipientProfile = recipientProfile;
    }

    /**
     * Converts a database row (from the UserMessageDetails VIEW) to a UserMessageDetails instance.
     * Assumes the row object keys match the column names/aliases defined in the VIEW.
     * @param {Object | null} row - The database row object or null.
     * @returns {UserMessageDetails | null} The UserMessageDetails instance or null if no row/required data is provided.
     */
    static fromDbRow(row) {
        if (!row) return null;

        if (!row.messageId || !row.body || row.messageCreatedAt === undefined || !row.messageType) {
            console.error("UserMessageDetails.fromDbRow: Missing required message fields in database row:", row);
            return null;
        }

        // --- Extract and Create Sender UserProfile ---
        // The view provides senderPrincipalId, senderUsername, senderDisplayName, senderAvatar,
        // and senderUserId, senderKarma, etc. if the sender is a RegisteredUser.
        const senderData = {
            userId: row.senderUserId, // This will be null if the sender is not a RegisteredUser in UserProfile
            principalId: row.senderPrincipalId,
            username: row.senderUsername,
            displayName: row.senderDisplayName,
            avatar: row.senderAvatar,
            karma: row.senderKarma,
            isVerified: row.senderIsVerified,
            status: row.senderStatus,
            accountCreated: row.senderAccountCreated,
            // Add other fields from UserProfile view as needed by UserProfile model
        };
        // Create UserProfile only if essential identifying info (like principalId or username for a principal) is present.
        // If senderPrincipalId is null (e.g. some system messages), senderProfile will be null.
        // If senderPrincipalId is present but senderUserId is null (e.g. admin principal not in RegisteredUser),
        // UserProfile.fromDbRow might still create a partial profile or return null depending on its logic.
        // The condition `senderData.principalId ? senderData : null` is robust.
        const senderProfile = senderData.principalId ? UserProfile.fromDbRow(senderData) : null;


        // --- Extract and Create Recipient UserProfile ---
        const recipientData = {
            userId: row.recipientUserId,
            principalId: row.recipientPrincipalId,
            username: row.recipientUsername,
            displayName: row.recipientDisplayName,
            avatar: row.recipientAvatar,
            karma: row.recipientKarma,
            isVerified: row.recipientIsVerified,
            status: row.recipientStatus,
            accountCreated: row.recipientAccountCreated,
        };
        const recipientProfile = recipientData.principalId ? UserProfile.fromDbRow(recipientData) : null;

        return new UserMessageDetails(
            row.messageId,
            row.parentMessageId,
            row.body,
            row.messageType,
            row.messageCreatedAt,
            row.isRead ?? false,
            row.senderDeleted ?? false,
            row.recipientDeleted ?? false,
            senderProfile,
            recipientProfile
        );
    }
}

export default UserMessageDetails;