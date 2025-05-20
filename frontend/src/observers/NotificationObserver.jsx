// frontend/src/observers/notificationObserver.js
import IObserver from '#interfaces/IObserver.jsx'

/**
 * @class NotificationObserver
 * @implements {IObserver}
 * Observes WebSocket messages and updates the notification context.
 */
class NotificationObserver {
    /**
     * @param {function} addNotificationCallback - The function to call to add a notification to the context.
     */
    constructor(addNotificationCallback) {
        if (typeof addNotificationCallback !== 'function') {
            throw new Error("NotificationObserver requires a valid addNotification callback function.");
        }
        this.addNotification = addNotificationCallback;
    }

    /**
     * Called by the Subject when a new message arrives.
     * @param {any} data - The data payload from the WebSocket message.
     * @override // Optional JSDoc tag
     */
    update(data) {
        // --- Logic to handle specific notification types ---
        if (data?.type === 'NEW_NOTIFICATION' && data.notification) {
            this.addNotification(data.notification);
        }
        // --- Add more handlers ---
        else {
            console.log('[NotificationObserver] Received unhandled message type or format:', data?.type);
        }
    }
}

export default NotificationObserver;
