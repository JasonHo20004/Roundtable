/**
 * @class ChatObserver
 * Observes WebSocket messages and updates the chat context for new messages.
 */
class ChatObserver {
    /**
     * @param {function(object): void} addMessageCallback - Function from ChatContext to add a message.
     */
    constructor(addMessageCallback) {
        if (typeof addMessageCallback !== 'function') {
            throw new Error("ChatObserver requires a valid addMessage callback function.");
        }
        /** @type {function(object): void} */
        this.addMessage = addMessageCallback;
        console.log("[ChatObserver] Initialized.");
    }

    /**
     * Called by the Subject when a new message arrives.
     * @param {any} data - The data payload from the WebSocket message.
     */
    update(data) {
        console.log("[ChatObserver] Received data:", data);
        if (data?.type === 'NEW_CHAT_MESSAGE' && data.message) {
            // Basic validation of expected message properties
            if (data.message.messageId && data.message.senderProfile.userId && data.message.recipientProfile.userId && data.message.body && data.message.messageCreatedAt) {
                console.log("[ChatObserver] Processing NEW_CHAT_MESSAGE:", data.message);
                this.addMessage(data.message);
            } else {
                console.warn("[ChatObserver] Received NEW_CHAT_MESSAGE but payload is invalid:", data.message);
            }
        }
    }
}

export default ChatObserver;