// backend/websocket/websocket-manager.js

// Store active connections (e.g., mapping userId to WebSocket object)
const userConnections = new Map();

class WebSocketManager {
    /**
     * Adds a user's WebSocket connection.
     * @param {string} userId - The ID of the user connecting.
     * @param {WebSocket} ws - The WebSocket connection object.
     */
    addConnection(userId, ws) {
        console.log(`[WS Manager] Adding connection for user: ${userId}`);
        userConnections.set(userId, ws);

        ws.on('close', () => {
            console.log(`[WS Manager] Connection closed for user: ${userId}`);
            this.removeConnection(userId);
        });

        ws.on('error', (error) => {
            console.error(`[WS Manager] WebSocket error for user ${userId}:`, error);
            this.removeConnection(userId); // Remove on error too
        });
    }

    /**
     * Removes a user's WebSocket connection.
     * @param {string} userId - The ID of the user disconnecting.
     */
    removeConnection(userId) {
        if (userConnections.has(userId)) {
            console.log(`[WS Manager] Removing connection for user: ${userId}`);
            userConnections.delete(userId);
        }
    }

    /**
     * Sends a notification payload to a specific user if connected.
     * @param {string} userId - The recipient user ID.
     * @param {object} payload - The notification data to send.
     */
    sendNotification(userId, payload) {
        const ws = userConnections.get(userId);
        if (ws && ws.readyState === ws.OPEN) { // Check if connection exists and is open
            console.log(`[WS Manager] Sending notification to user ${userId}:`, payload);
            try {
                ws.send(JSON.stringify(payload));
            } catch (error) {
                console.error(`[WS Manager] Failed to send message to user ${userId}:`, error);
                this.removeConnection(userId); // Clean up failed connection
            }
        } else {
            console.log(`[WS Manager] No active WebSocket connection found for user ${userId} to send notification.`);
        }
    }

    /**
     * Closes all active WebSocket connections.
     * Useful for graceful shutdown.
     */
    closeAllConnections() {
        console.log('[WS Manager] Closing all connections...');
        userConnections.forEach((ws, userId) => {
            try {
                ws.close(1001, 'Server shutting down'); // 1001 Going Away
            } catch (e) {
                console.error(`[WS Manager] Error closing connection for user ${userId}:`, e);
            }
        });
        userConnections.clear();
        console.log('[WS Manager] All connections closed.');
    }
}

// Export a singleton instance
export default new WebSocketManager();