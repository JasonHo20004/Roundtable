// backend/models/message.model.js
/**
 * @typedef {'direct' | 'system' | 'moderator_communication' | 'admin_communication'} MessageTypeEnum
 * Represents the type category of a message, mirroring the "MessageType" ENUM in the database.
 */
export const MessageTypeEnum = Object.freeze({
    /** Standard user-to-user message. */
    DIRECT: 'direct',
    /** Automated system message (e.g., warnings, notifications). */
    SYSTEM: 'system',
    /** Message related to moderation actions/discussions. */
    MODERATOR_COMMUNICATION: 'moderator_communication',
    /** Message related to site-wide admin actions/discussions. */
    ADMIN_COMMUNICATION: 'admin_communication'
});


/**
 * Represents a direct message record in the "Message" table.
 */
class Message {
    /**
     * Creates an instance of Message.
     * @param {string | null} messageId - The unique identifier (UUID), null if new.
     * @param {string | null} parentMessageId - UUID of the message being replied to, null if not a reply.
     * @param {string | null} senderPrincipalId - UUID of the sender's Principal, null if deleted/system.
     * @param {string | null} recipientPrincipalId - UUID of the recipient's Principal, null if deleted.
     * @param {string} body - The content of the message. Required.
     * @param {MessageTypeEnum} [messageType='direct'] - The type category of the message.
     * @param {Date | null} [createdAt=null] - Timestamp of creation (set by DB default).
     * @param {boolean} [isRead=false] - Whether the recipient has marked the message as read.
     * @param {boolean} [senderDeleted=false] - Whether the sender has soft-deleted the message.
     * @param {boolean} [recipientDeleted=false] - Whether the recipient has soft-deleted the message.
     */
    constructor(
        messageId, parentMessageId, senderPrincipalId, recipientPrincipalId, body,
        messageType = MessageTypeEnum.DIRECT,
        createdAt = null, isRead = false, senderDeleted = false, recipientDeleted = false
    ) {
        /** @type {string | null} */
        this.messageId = messageId;
        /** @type {string | null} */
        this.parentMessageId = parentMessageId;
        /** @type {string | null} */
        this.senderPrincipalId = senderPrincipalId; // UPDATED
        /** @type {string | null} */
        this.recipientPrincipalId = recipientPrincipalId; // UPDATED
        /** @type {string} */
        this.body = body;
        /** @type {MessageTypeEnum} */
        this.messageType = messageType;
        /** @type {Date | null} */
        this.createdAt = createdAt ? new Date(createdAt) : null;
        /** @type {boolean} */
        this.isRead = isRead;
        /** @type {boolean} */
        this.senderDeleted = senderDeleted;
        /** @type {boolean} */
        this.recipientDeleted = recipientDeleted;

        if (!this.body) {
            throw new Error("Message body cannot be empty.");
        }
        if (!Object.values(MessageTypeEnum).includes(this.messageType)) {
            console.warn(`Invalid messageType provided: ${this.messageType}. Defaulting to '${MessageTypeEnum.DIRECT}'.`);
            this.messageType = MessageTypeEnum.DIRECT;
        }
    }

    /**
     * Converts a database row object from the "Message" table into a Message instance.
     * @param {Object | null} row - The database row object.
     * @returns {Message | null} A Message instance or null if no row provided.
     */
    static fromDbRow(row) {
        if (!row) {
            return null;
        }
        return new Message(
            row.messageId,
            row.parentMessageId,
            row.senderPrincipalId,
            row.recipientPrincipalId,
            row.body,
            row.messageType,
            row.createdAt,
            row.isRead,
            row.senderDeleted,
            row.recipientDeleted
        );
    }
}

export default Message;