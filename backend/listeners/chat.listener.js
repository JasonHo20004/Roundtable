// backend/listeners/chat.listener.js
import EventBus from '#core/event-bus.js';
import WebSocketManager from '#core/websocket-manager.js';

EventBus.subscribe('chat.message.created', async (payload) => {
    const {recipientUserId, message} = payload; // Expecting detailed message object

    // Validate payload received from the event bus
    if (!recipientUserId || !message || !message.messageId || !message.senderProfile) { // Example check
        console.error('[ChatListener] Received invalid payload for chat.message.created:', payload);
        return;
    }

    console.log(`[ChatListener] Received 'chat.message.created' event for recipient: ${recipientUserId}`);

    try {
        // Prepare payload for WebSocket client
        const webSocketPayload = {
            type: 'NEW_CHAT_MESSAGE', // Consistent type for frontend
            message: message // Send the full UserMessageDetails object
        };

        // Send via WebSocketManager
        WebSocketManager.sendNotification(recipientUserId, webSocketPayload);
        console.log(`[ChatListener] Sent NEW_CHAT_MESSAGE notification to user ${recipientUserId}`);

    } catch (error) {
        console.error(`[ChatListener] Error processing chat.message.created event for recipient ${recipientUserId}:`, error);
    }
});

// EventBus.subscribe('chat.typing.started', (payload) => { ... });
// EventBus.subscribe('chat.read', (payload) => { ... });

