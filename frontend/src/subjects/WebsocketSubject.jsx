// frontend/src/subjects/WebsocketSubject.jsx
import ISubject from "#interfaces/ISubject.jsx";

/**
 * @class WebsocketSubject
 * @implements {ISubject}
 * Manages the WebSocket connection and notifies registered observers of incoming messages.
 */
class WebsocketSubject {
    /**
     * @param {string} wsUrl The WebSocket server URL.
     */
    constructor(wsUrl) {
        if (!wsUrl) {
            throw new Error("WebsocketSubject requires a wsUrl.");
        }
        this.wsUrl = wsUrl;
        /** @type {WebSocket | null} */
        this.socket = null;
        /** @type {Set<IObserver>} */ // Use the JSDoc type here
        this.observers = new Set();
        this.connectionPromise = null;
        this.reconnectAttempts = 0;
        this.MAX_RECONNECT_ATTEMPTS = 5;
        this.RECONNECT_DELAY_MS = 3000;
        this.keepaliveInterval = null;
        this.currentUserId = null;

        // Bind methods
        this._handleOpen = this._handleOpen.bind(this);
        this._handleMessage = this._handleMessage.bind(this);
        this._handleError = this._handleError.bind(this);
        this._handleClose = this._handleClose.bind(this);
        this._attemptReconnect = this._attemptReconnect.bind(this);
        this._startKeepalive = this._startKeepalive.bind(this);
        this._stopKeepalive = this._stopKeepalive.bind(this);
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.subscribe = this.subscribe.bind(this);
        this.unsubscribe = this.unsubscribe.bind(this);
        this.notify = this.notify.bind(this);
    }

    // --- ISubject Interface Methods ---

    /**
     * Adds an observer to the list.
     * @param {IObserver} observer - The observer object (must have an `update` method).
     * @override
     */
    subscribe(observer) {
        if (observer && typeof observer.update === 'function') {
            this.observers.add(observer);
        } else {
            console.error("[WebsocketSubject] Invalid observer provided. Must have an 'update' method.", observer);
        }
    }

    /**
     * Removes an observer from the list.
     * @param {IObserver} observer - The observer object to remove.
     * @override
     */
    unsubscribe(observer) {
        if (this.observers.has(observer)) {
            this.observers.delete(observer);
        }
    }

    /**
     * Notifies all registered observers with the given data.
     * @param {any} data - The data payload from the WebSocket message.
     * @override
     */
    notify(data) {
        Array.from(this.observers).forEach(observer => {
            try {
                // No need to check for update method here if subscribe enforces it
                observer.update(data);
            } catch (error) {
                console.error("[WebsocketSubject] Error calling observer update method:", error, observer);
            }
        });
    }

    // --- WebSocket Connection Management (code remains the same) ---
    connect(userId) {
        // ... connection logic ...
        if (!userId) {
            console.warn("[WebsocketSubject] Cannot connect without userId.");
            return Promise.reject(new Error("User ID is required to connect WebSocket."));
        }
        this.currentUserId = userId;
        this.connectionPromise = new Promise((resolve, reject) => {
            try {
                this._cleanupConnectionState(false);
                this.socket = new WebSocket(this.wsUrl);
                this.socket.onopen = () => this._handleOpen(resolve);
                this.socket.onmessage = this._handleMessage;
                this.socket.onerror = (error) => this._handleError(reject, error);
                this.socket.onclose = this._handleClose;
            } catch (error) {
                console.error("[WebsocketSubject] Error creating WebSocket instance:", error);
                this.connectionPromise = null;
                reject(error);
            }
        });
        return this.connectionPromise;
    }

    disconnect() {
        // ... disconnect logic ...
        this._stopKeepalive();
        if (this.socket) {
            this.reconnectAttempts = this.MAX_RECONNECT_ATTEMPTS;
            this.socket.close(1000, "User disconnected");
        }
        this._cleanupConnectionState(true);
    }

    sendMessage(message) {
        // ... send logic ...
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            try {
                if (message === 'ping') {
                    this.socket.send('ping');
                } else {
                    this.socket.send(JSON.stringify(message));
                }
            } catch (error) {
                console.error("[WebsocketSubject] Error sending message:", error, message);
            }
        } else {
            console.error("[WebsocketSubject] Cannot send message, socket not open or available.");
        }
    }

    // --- Internal Helper Methods (code remains the same) ---
    _handleOpen(resolve) {
        this.reconnectAttempts = 0;
        this.connectionPromise = null;
        this._startKeepalive();
        resolve(this.socket);
    }

    _handleMessage(event) {
        try {
            if (event.data === 'pong') {
                return;
            }
            const data = JSON.parse(event.data);
            this.notify(data);
        } catch (error) {
            console.error("[WebsocketSubject] Error parsing message:", error, "Raw data:", event.data);
        }
    }

    _handleError(reject, error) {
        console.error("[WebsocketSubject] WebSocket error occurred:", error);
        if (this.connectionPromise && reject) {
            reject(new Error("WebSocket connection error."));
        }
        this.connectionPromise = null;
    }

    _handleClose(event) {
        this._stopKeepalive();
        const wasConnected = !!this.socket;
        const isPermanentClosure = event.code === 1000 || event.code === 1001 || event.code === 1008 || event.code >= 4000;
        this._cleanupConnectionState(isPermanentClosure || this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS);

        if (wasConnected && !isPermanentClosure && this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
            this._attemptReconnect();
        } else if (wasConnected && !isPermanentClosure) {
            console.error(`[WebSocketSubject] Max reconnect attempts reached for user ${this.currentUserId}. Giving up.`);
            // Observers are cleared in _cleanupConnectionState if max attempts reached
        }
    }

    _cleanupConnectionState(clearObservers = false) {
        if (this.socket) {
            this.socket.onopen = null;
            this.socket.onmessage = null;
            this.socket.onerror = null;
            this.socket.onclose = null;
            this.socket = null;
        }
        this.connectionPromise = null;
        if (clearObservers) {
            this.observers.clear();
        }
    }

    _attemptReconnect() {
        if (!this.currentUserId || this.connectionPromise) {
            return;
        }

        this.reconnectAttempts++;
        setTimeout(() => {
            if (this.reconnectAttempts <= this.MAX_RECONNECT_ATTEMPTS) {
                this.connect(this.currentUserId).then(r => {
                    if (r) { /* empty */
                    } else {
                        this._attemptReconnect();
                    }
                }).catch(() => {
                    this._attemptReconnect();
                });
            } else {
                // Max reconnect attempts reached
                this._cleanupConnectionState(true); // Clear observers if giving up
            }
        }, this.RECONNECT_DELAY_MS);
    }

    _startKeepalive() {
        this._stopKeepalive();
        this.keepaliveInterval = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.sendMessage('ping');
            } else {
                console.warn("[WebsocketSubject] Keepalive: Socket not open, stopping ping.");
                this._stopKeepalive();
            }
        }, 30000);
    }

    _stopKeepalive() {
        if (this.keepaliveInterval) {
            clearInterval(this.keepaliveInterval);
            this.keepaliveInterval = null;
        }
    }
}

// --- Create and Export Singleton Instance ---
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${wsProtocol}//${window.location.hostname}:5000`;

export default new WebsocketSubject(wsUrl);
