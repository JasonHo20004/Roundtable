// frontend/src/services/websocketService.js

let socket = null;
let observers = [];
let connectionPromise = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 3000;

// Determine WebSocket protocol based on HTTP protocol
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsHost = process.env.NODE_ENV === 'production' 
    ? window.location.hostname  // Use the same hostname in production
    : `${window.location.hostname}:5000`; // Use port 5000 in development
const wsUrl = `${wsProtocol}//${wsHost}`;

// --- Helper function to notify all observers ---
function notifyObservers(data) {
    observers.slice().forEach(observerCallback => {
        try {
            observerCallback(data);
        } catch (error) {
            console.error("[WebSocket Service] Error calling observer:", error);
            // Optionally remove the faulty observer: unsubscribe(observerCallback);
        }
    });
}

function connectWebSocket(userId) {
    if (connectionPromise) {
        return connectionPromise;
    }
    if (socket && socket.readyState === WebSocket.OPEN) {
        return Promise.resolve(socket);
    }
    connectionPromise = new Promise((resolve, reject) => {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log("[WebSocket Service] Connection established.");
            reconnectAttempts = 0;
            connectionPromise = null;
            resolve(socket);
        };

        socket.onmessage = (event) => {
            try {
                if (event.data === 'pong') {
                    return;
                }
                const data = JSON.parse(event.data);
                // --- Call the notify function ---
                notifyObservers(data);
            } catch (error) {
                console.error("[WebSocket Service] Error parsing message or notifying observers:", error, "Raw data:", event.data);
            }
        };

        socket.onerror = (error) => {
            console.error("[WebSocket Service] Connection error:", error);
            connectionPromise = null;
            reject(error);
            handleDisconnect(userId);
        };

        socket.onclose = (event) => {
            console.log(`[WebSocket Service] Connection closed. Code: ${event.code}, Reason: ${event.reason}`);
            socket = null;
            connectionPromise = null;
            // Clear observers only if it's not a temporary disconnect/reconnect scenario
            if (event.code === 1000 || event.code === 1001 || event.code === 1008 || event.code >= 4000) {
                observers = []; // Clear observers on permanent close
            }
            // Handle reconnect attempts for appropriate codes
            if (event.code !== 1000 && event.code !== 1001 && event.code !== 1008 && event.code < 4000) {
                handleDisconnect(userId);
            }
        };
    });

    return connectionPromise;
}

function handleDisconnect(userId) {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`[WebSocket Service] Attempting reconnect ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${RECONNECT_DELAY_MS / 1000}s...`);
        setTimeout(() => connectWebSocket(userId), RECONNECT_DELAY_MS);
    } else {
        console.error(`[WebSocket Service] Max reconnect attempts reached for user ${userId}. Giving up.`);
        observers = []; // Clear observers if giving up
    }
}

// Keepalive ping interval
setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send('ping');
    }
}, 30000);

const websocketService = {
    connect: (userId) => {
        if (!userId) {
            console.warn("[WebSocket Service] Cannot connect without userId.");
            return Promise.reject("User ID is required to connect WebSocket.");
        }
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            return connectWebSocket(userId);
        }
        return Promise.resolve(socket);
    },
    disconnect: () => {
        if (socket) {
            console.log("[WebSocket Service] Disconnecting...");
            reconnectAttempts = MAX_RECONNECT_ATTEMPTS;
            socket.close(1000, "User disconnected");
            socket = null;
            observers = []; // Clear observers on manual disconnect
        }
    },
    sendMessage: (message) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        } else {
            console.error("[WebSocket Service] Cannot send message, socket not open.");
        }
    },
    subscribe: (observerCallback) => {
        if (typeof observerCallback === 'function' && !observers.includes(observerCallback)) {
            console.log("[WebSocket Service] Adding observer:", observerCallback.name || 'anonymous function');
            observers.push(observerCallback);
        } else if (observers.includes(observerCallback)) {
            console.log("[WebSocket Service] Observer already subscribed.");
        }
    },
    unsubscribe: (observerCallback) => {
        const initialLength = observers.length;
        observers = observers.filter(listener => listener !== observerCallback);
        if (observers.length < initialLength) {
            console.log("[WebSocket Service] Removing observer:", observerCallback.name || 'anonymous function');
        }
    }
};

export default websocketService;