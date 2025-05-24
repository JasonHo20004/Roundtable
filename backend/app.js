// backend/app.js
import express from 'express';
import session from 'express-session';
import {RedisStore} from 'connect-redis';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import {WebSocketServer} from 'ws';

// WebSocket
import WebSocketManager from '#core/websocket-manager.js';

// --- PostgresDB & Cache Clients ---
import redisClient from '#db/redis.js';
import PostgresDB from "#db/postgres.js";

// Routes
import authRoutes from '#routes/auth.routes.js';
import postRoutes from '#routes/post.routes.js';
import voteRoutes from '#routes/vote.routes.js';
import commentRoutes from '#routes/comment.routes.js';
import subtableRoutes from "#routes/subtable.routes.js";
import notificationRoutes from "#routes/notification.routes.js";
import chatRoutes from "#routes/chat.routes.js";
import homeRoutes from "#routes/home.routes.js";
import userRoutes from "#routes/user.routes.js";


import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Listeners
import '#listeners/notification.listener.js';
import '#listeners/chat.listener.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



dotenv.config()

const app = express()
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(express.json());

app.use(express.urlencoded({extended: true}));

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

const internalIp = process.env.FRONTEND_INTERNAL_IP;
const frontendPort = process.env.FRONTEND_PORT;
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null,
    process.env.NODE_ENV === 'development' ? `http://localhost:${frontendPort}` : null,
    process.env.NODE_ENV === 'development' && internalIp ? `http://${internalIp}:${frontendPort}` : null
].filter(Boolean); // Remove null/undefined values

console.log('Allowed Origins:', allowedOrigins);

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400 // 24 hours
};

const redisStore = new RedisStore({
    client: redisClient,
    prefix: 'session:',
});

app.use(cors(corsOptions));
app.set('trust proxy', 1);

// Configure session middleware
const sessionMiddleware = session({
    store: redisStore,
    secret: process.env.SESSION_SECRET_KEY || 'your-very-strong-secret-key',
    rolling: true,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: (parseInt(process.env.SESSION_EXPIRATION_TIME, 10) || 30 * 60) * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    },
    proxy: true // Trust the reverse proxy
});
app.use(sessionMiddleware);

// --- HTTP Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/s',subtableRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/users', userRoutes);


// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('[Global Error Handler]', err);

    // Set default status code and message
    const statusCode = err.statusCode || 500;
    const message = err.message || 'An unexpected error occurred';

    // Set content type to JSON
    res.setHeader('Content-Type', 'application/json');

    // Send JSON response
    res.status(statusCode).json({
        success: false,
        message: message,
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// --- WebSocket Server Setup ---
const server = http.createServer(app);
const wss = new WebSocketServer({noServer: true});

server.on('upgrade', (request, socket, head) => {
    sessionMiddleware(request, {}, (err) => { // Pass empty response object and next() callback
        if (err) {
            console.error('[WebSocket Upgrade] Session parsing error:', err);
            socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
            socket.destroy();
            return;
        }

        const userId = request.session?.userId; // Access session data parsed by middleware

        if (userId) {
            console.log(`[WebSocket Upgrade] User authenticated via session: ${userId}`);
            // Proceed with WebSocket handshake
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request, userId); // Pass the authenticated userId
            });
        } else {
            console.log('[WebSocket Upgrade] Authentication failed (no userId in session).');
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
        }
    });
});

wss.on('connection', (ws, request, authenticatedUserId) => {
    console.log(`[WebSocket Server] Client connected (User ID: ${authenticatedUserId})`);

    if (!authenticatedUserId) {
        console.warn('[WebSocket Server] Connection established but userId was not identified during upgrade.');
        ws.close(1008, "User identification failed."); // 1008 = Policy Violation
        return;
    }

    // Add connection to the manager
    WebSocketManager.addConnection(authenticatedUserId, ws);

    // Handle messages received from this specific client
    ws.on('message', (message) => {
        try {
            // Attempt to parse as Buffer -> String -> JSON
            const messageString = message.toString();
            if (messageString === 'ping') {
                // console.log(`[WebSocket Server] Received ping from ${authenticatedUserId}`);
                ws.send('pong');
                return;
            }

            const data = JSON.parse(messageString);
            console.log(`[WebSocket Server] Received message from ${authenticatedUserId}:`, data);
        } catch (e) {
            console.error(`[WebSocket Server] Failed to parse message from ${authenticatedUserId} or invalid format:`, message.toString(), e);
            ws.send(JSON.stringify({type: 'ERROR', message: 'Invalid message format.'}));
        }
    });
});

// Start the HTTP server (which includes WebSocket handling)
const HOST = process.env.BACKEND_HOST;
const PORT = process.env.BACKEND_PORT;
server.listen(PORT, HOST, () => {
    console.log(`HTTP and WebSocket Server running on http://${HOST}:${PORT}`);
});

// --- Graceful Shutdown ---
const signals = {'SIGINT': 2, 'SIGTERM': 15};
Object.keys(signals).forEach((signal) => {
    process.on(signal, async () => {
        console.log(`\nReceived ${signal}. Shutting down gracefully...`);
        WebSocketManager.closeAllConnections(); // Close WebSocket connections
        server.close(() => {
            console.log('HTTP server closed.');
            // Close database connections
            redisClient.quit(() => {
                console.log('Redis connection closed.');
                process.exit(128 + signals[signal]);
            });
            PostgresDB.destroy(() => {
                console.log('Postgres connection pool closed.');
            }); // Close Knex pool
        });
    });
});