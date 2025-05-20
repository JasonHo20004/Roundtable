// backend/services/chat.service.js
import MessageDAO from '#daos/message.dao.js';
import UserMessageDetailsDAO from '#daos/user-message-details.dao.js';
import RegisteredUserDAO from '#daos/registered-user.dao.js';
import Message, {MessageTypeEnum} from '#models/message.model.js';
import EventBus from '#core/event-bus.js';
import {AppError, BadRequestError, ForbiddenError, InternalServerError, NotFoundError} from '#errors/AppError.js';
import {postgresInstance} from "#db/postgres.js";

class ChatService {
    /**
     * Constructor for ChatService.
     * @param {MessageDAO} messageDao - DAO for base message operations.
     * @param {UserMessageDetailsDAO} userMessageDetailsDao - DAO for the user message details view/object.
     * @param {RegisteredUserDAO} registeredUserDao - DAO for registered users.
     * @param {EventBus} eventBus - System event bus.
     */
    constructor(messageDao, userMessageDetailsDao, registeredUserDao, eventBus) {
        this.messageDAO = messageDao;
        this.userMessageDetailsDAO = userMessageDetailsDao;
        this.registeredUserDAO = registeredUserDao;
        this.eventBus = eventBus;
    }

    /**
     * Retrieves the list of conversation partners (with latest message details) for a user.
     * @param {string} principalId - The ID of the user whose conversations to fetch.
     * @param {object} [options={}] - Pagination/filtering options (e.g., { limit, offset }).
     * @returns {Promise<Array<ConversationPartnerPreview>>} - List of partner preview objects.
     * @throws {BadRequestError} If userId is missing.
     * @throws {InternalServerError} For database errors.
     */
    async getConversationPartnersPreviewData(principalId, options = {}) {
        if (!principalId) {
            throw new BadRequestError('User ID is required to fetch conversations.');
        }
        const userExists = await this.registeredUserDAO.getByPrincipalId(principalId);
        if (!userExists) {
            throw new NotFoundError(`User with ID ${principalId} not found.`);
        }
        try {
            console.log('userExists:', userExists);
            return await this.messageDAO.getConversationPartnersPreviewData(userExists.principalId, options);
        } catch (error) {
            console.error(`[ChatService:getConversationPartnersPreviewData] Error for user ${principalId}:`, error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new InternalServerError('Could not retrieve conversation list.');
        }
    }

    /**
     * Retrieves the message history between two users.
     * @param {string} requestingPrincipalId - The ID of the user making the request.
     * @param {string} partnerPrincipalId - The ID of the user whose messages to fetch.
     * @param {object} [options={}] - Pagination/filtering options (e.g., { limit, offset }).
     * @returns {Promise<Array<UserMessageDetails>>} - Array of detailed messages.
     * @throws {BadRequestError} If required IDs are missing or user tries to chat with self.
     * @throws {NotFoundError} If the partner user doesn't exist.
     * @throws {ForbiddenError} If fetching messages from the partner is disallowed (e.g., banned/blocked user).
     * @throws {InternalServerError} For database errors.
     */
    async getMessages(requestingPrincipalId, partnerPrincipalId, options = {}) {
        if (!requestingPrincipalId || !partnerPrincipalId) {
            throw new BadRequestError('Requesting user ID and partner user ID are required.');
        }
        if (requestingPrincipalId === partnerPrincipalId) {
            throw new BadRequestError('Cannot fetch messages with yourself.');
        }

        // Validate partner exists and is accessible
        const partnerUser = await this.registeredUserDAO.getByPrincipalId(partnerPrincipalId);
        if (!partnerUser) {
            throw new NotFoundError(`User with ID ${partnerPrincipalId} not found.`);
        }
        if (partnerUser.status !== 'active') { // Example status check
            throw new ForbiddenError(`Cannot retrieve messages involving user with status: ${partnerUser.status}.`);
        }
        // Get requesting user
        const requestingUser = await this.registeredUserDAO.getByPrincipalId(requestingPrincipalId);
        if (!requestingUser) {
            throw new NotFoundError(`Requesting user with ID ${requestingPrincipalId} not found.`);
        }

        // Sanitize options
        const queryOptions = {
            limit: Math.max(1, parseInt(options.limit, 10) || 50),
            offset: Math.max(0, parseInt(options.offset, 10) || 0),
            order: ['asc', 'desc'].includes(options.order?.toLowerCase()) ? options.order.toLowerCase() : 'desc', // Default to newest first
            requestingPrincipalId: requestingPrincipalId,
        };

        try {
            // Use the DAO for fetching detailed messages view/object
            const messages = await this.userMessageDetailsDAO.getMessagesBetweenUsers(
                requestingPrincipalId,
                partnerPrincipalId,
                queryOptions
            );
            console.log('messages:', messages);
            return messages;
        } catch (error) {
            console.error(`[ChatService:getMessages] Error between ${requestingUser.principalId} and ${partnerUser.principalId}:`, error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new InternalServerError('Could not retrieve messages.');
        }
    }

    /**
     * Creates a new message, saves it, fetches its detailed view, and emits an event.
     * @param {string} senderPrincipalId - The ID of the message sender.
     * @param {string} recipientPrincipalId - The ID of the message recipient.
     * @param {string} body - The message content (trimmed).
     * @returns {Promise<UserMessageDetails>} - The created message with full sender/recipient details.
     * @throws {BadRequestError} If validation fails (missing fields, same user, empty body).
     * @throws {NotFoundError} If the recipient user doesn't exist.
     * @throws {ForbiddenError} If sending to the recipient is disallowed.
     * @throws {InternalServerError} For database or unexpected errors.
     */
    async sendMessage(senderPrincipalId, recipientPrincipalId, body) {
        const trimmedBody = body?.trim(); // Trim body early
        if (!senderPrincipalId || !recipientPrincipalId || !trimmedBody) {
            throw new BadRequestError('Sender ID, Recipient ID, and non-empty message body are required.');
        }
        if (senderPrincipalId === recipientPrincipalId) {
            throw new BadRequestError('Cannot send a message to yourself.');
        }

        // Validate recipient existence and status
        const recipientUser = await this.registeredUserDAO.getByPrincipalId(recipientPrincipalId);
        if (!recipientUser) {
            throw new NotFoundError(`Recipient user with ID ${recipientPrincipalId} not found.`);
        }
        if (recipientUser.status !== 'active') { // Example check
            throw new ForbiddenError(`Cannot send message to user with status: ${recipientUser.status}.`);
        }
        // Validate
        const senderUser = await this.registeredUserDAO.getByPrincipalId(senderPrincipalId);
        if (!senderUser) {
            throw new NotFoundError(`Sender user with ID ${senderPrincipalId} not found.`);
        }

        let savedMessage;
        try {
            // Save within a transaction (optional but good for potential related updates)
            savedMessage = await postgresInstance.transaction(async (trx) => {
                const newMessage = new Message(
                    null, null, senderUser.principalId, recipientUser.principalId, trimmedBody, MessageTypeEnum.DIRECT
                );
                return await this.messageDAO.create(newMessage, trx);
            });

            if (!savedMessage?.messageId) {
                throw new InternalServerError('Failed to save message or retrieve its ID.');
            }

            // Fetch the detailed view *after* transaction commits
            const detailedCreatedMessage = await this.userMessageDetailsDAO.getByMessageId(savedMessage.messageId);
            if (!detailedCreatedMessage) {
                console.error(`[ChatService:sendMessage] CRITICAL: Could not fetch details for just-created message ${savedMessage.messageId}.`);
                throw new InternalServerError('Failed to retrieve created message details after saving.');
            }

            // Emit event for real-time delivery
            this.eventBus.emit('chat.message.created', {
                recipientUserId: recipientUser.userId,
                message: detailedCreatedMessage // Send the rich object
            });

            return detailedCreatedMessage; // Return the detailed message

        } catch (error) {
            console.error(`[ChatService:sendMessage] Error from ${senderPrincipalId} to ${recipientUser.principalId}:`, error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new InternalServerError('Could not send message due to a server error.');
        }
    }

    /**
     * Marks messages sent by a partner as read by the requesting user.
     * @param {string} requestingPrincipalId - The user marking the messages as read.
     * @param {string} partnerPrincipalId - The user whose messages to mark as read.
     * @returns {Promise<number>} The number of messages marked as read.
     * @throws {BadRequestError} If required IDs are missing or user tries to read self messages.
     * @throws {NotFoundError} If the partner user doesn't exist.
     * @throws {InternalServerError} For database errors.
     */
    async markMessagesAsRead(requestingPrincipalId, partnerPrincipalId) {
        if (!requestingPrincipalId || !partnerPrincipalId) {
            throw new BadRequestError('Requesting user ID and partner user ID are required.');
        }
        if (requestingPrincipalId === partnerPrincipalId) {
            // Reading own messages doesn't make sense in this context
            return 0;
        }

        // Validate partner exists
        const partnerUser = await this.registeredUserDAO.getByPrincipalId(partnerPrincipalId);
        if (!partnerUser) {
            throw new NotFoundError(`Partner user with principal ID ${partnerPrincipalId} not found.`);
        }

        // Get requesting user
        const requestingUser = await this.registeredUserDAO.getByPrincipalId(requestingPrincipalId);
        if (!requestingUser) {
            throw new NotFoundError(`Requesting user with principal ID ${requestingPrincipalId} not found.`);
        }

        try {
            // Use transaction for atomicity of find + update (optional but safer)
            const updatedCount = await postgresInstance.transaction(async (trx) => {
                // 1. Find unread message IDs from partner to user
                const unreadMessages = await this.messageDAO.getUnreadMessages(partnerUser.principalId, requestingUser.principalId, trx);
                const messageIdsToUpdate = unreadMessages.map(msg => msg.messageId);

                if (messageIdsToUpdate.length === 0) {
                    return 0; // No messages to mark
                }

                // 2. Mark them as read using the DAO
                return await this.messageDAO.markAsRead(messageIdsToUpdate, requestingUser.principalId, trx);
            }); // Commit transaction

            // Emit event *after* successful commit
            if (updatedCount > 0) {
                this.eventBus.emit('chat.messages.read', {
                    readerUserId: requestingUser.userId,
                    senderUserId: partnerUser.userId,
                    count: updatedCount
                });
            }
            return updatedCount;

        } catch (error) {
            console.error(`[ChatService:markMessagesAsRead] Error for user ${requestingPrincipalId} marking messages from partner ${partnerPrincipalId} as read:`, error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new InternalServerError('Could not mark messages as read.');
        }
    }
}

// Inject dependencies
export default new ChatService(
    MessageDAO,
    UserMessageDetailsDAO,
    RegisteredUserDAO,
    EventBus
);