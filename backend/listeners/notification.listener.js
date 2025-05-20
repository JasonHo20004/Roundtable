// backend/listeners/notification.listener.js
import EventBus from '#core/event-bus.js';
import WebSocketManager from '#core/websocket-manager.js';

// Listen for a generic 'notification.created' event
EventBus.subscribe('notification.created', async (payload) => {
    // Expect payload to be { recipientUserId: string, notification: Notification }
    const {recipientUserId, notification} = payload;

    if (!recipientUserId || !notification) {
        console.error('[NotificationListener] Received invalid payload for notification.created:', payload);
        return;
    }

    console.log(`[NotificationListener] Received 'notification.created' for user ${recipientUserId}. Type: ${notification.type}`);

    // Structure the payload for the WebSocket client
    const webSocketPayload = {
        type: 'NEW_NOTIFICATION', // Generic type for client handling
        notification: notification // Send the full notification object
    };

    // Send via WebSocketManager
    WebSocketManager.sendNotification(recipientUserId, webSocketPayload);
});

// EventBus.subscribe('notification.read', (payload) => { /* ... */ });
// EventBus.subscribe('notifications.read.all', (payload) => { /* ... */ });