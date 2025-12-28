/**************************************************************
 * 📄 FILE: index.ts
 *
 * 🚀 USE CASE:
 * Real-time WebSocket Chat Server
 *
 * FEATURES:
 * 🟢 Online users tracking
 * 🕒 Message timestamps
 * 👤 Username support
 * 🔁 Message broadcasting
 * 🌐 Works across LAN / multiple devices
 *
 * FLOW (HIGH LEVEL):
 * 1️⃣ Client connects to WebSocket
 * 2️⃣ Client sends "join" event with name
 * 3️⃣ Server stores user
 * 4️⃣ Server broadcasts online users list
 * 5️⃣ Client sends messages
 * 6️⃣ Server broadcasts messages with name + time
 * 7️⃣ On disconnect → user removed → list updated
 *************************************************************/

/* ===================== 📦 STEP 1: IMPORT MODULES ===================== */
/**
 * http       → creates HTTP server
 * ws         → handles WebSocket connections
 */

import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';

/* ===================== 🧠 STEP 2: DEFINE TYPES ===================== */
/**
 * Stores information about each connected client
 */
type ClientInfo = {
        name: string;
};

/* ===================== 🌐 STEP 3: CREATE HTTP SERVER ===================== */
/**
 * This HTTP server is used mainly as:
 * - Health check
 * - Base server for WebSocket
 */
const server = http.createServer((req, res) => {
        console.log(`🌍 [HTTP] ${req.method} ${req.url}`);

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('✅ WebSocket Chat Server is running\n');
});

/* ===================== 🔌 STEP 4: CREATE WEBSOCKET SERVER ===================== */
/**
 * WebSocket server is attached to the HTTP server
 */
const wss = new WebSocketServer({ server });

/* ===================== 🧠 STEP 5: STORE CONNECTED CLIENTS ===================== */
/**
 * Map:
 * Key   → WebSocket connection
 * Value → ClientInfo (username)
 */
const clients = new Map<WebSocket, ClientInfo>();

/* ===================== 🔁 STEP 6: HELPER FUNCTIONS ===================== */

/**
 * STEP 6.1
 * Broadcast any data to ALL connected clients
 */
function broadcast(data: unknown) {
        const payload = JSON.stringify(data);

        wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                        client.send(payload);
                }
        });
}

/**
 * STEP 6.2
 * Send updated online users list to everyone
 */
function broadcastUsers() {
        const users = Array.from(clients.values()).map(c => c.name);

        console.log(`🟢 [USERS] Online →`, users);

        broadcast({
                type: 'users',
                users
        });
}

/* ===================== 📡 STEP 7: HANDLE WEBSOCKET CONNECTIONS ===================== */

/**
 * STEP 7.1
 * When a new client connects
 */
wss.on('connection', (ws: WebSocket, req) => {
        console.log(`🔗 [WS] Client connected from ${req.socket.remoteAddress}`);

        /**
         * STEP 7.2
         * When a message is received from a client
         */
        ws.on('message', (data) => {
                try {
                        // Convert incoming message to JSON
                        const payload = JSON.parse(data.toString());

                        /* ---------- STEP 7.3: USER JOINS ---------- */
                        if (payload.type === 'join') {
                                // Save username for this socket
                                clients.set(ws, { name: payload.name });

                                console.log(`👤 [JOIN] ${payload.name} joined the chat`);

                                // Notify everyone about updated users list
                                broadcastUsers();
                                return;
                        }

                        /* ---------- STEP 7.4: CHAT MESSAGE ---------- */
                        if (payload.type === 'message') {
                                // Get sender name
                                const sender = clients.get(ws)?.name || 'Unknown';

                                // Create message object with timestamp
                                const chatMessage = {
                                        type: 'message',
                                        name: sender,
                                        message: payload.message,
                                        time: new Date().toLocaleTimeString()
                                };

                                console.log(`📩 [CHAT] ${sender}: ${payload.message}`);

                                // Broadcast message to all clients
                                broadcast(chatMessage);
                        }
                } catch (error) {
                        console.error('❌ [ERROR] Invalid message format', error);
                }
        });

        /**
         * STEP 7.5
         * When client disconnects
         */
        ws.on('close', () => {
                const user = clients.get(ws)?.name;

                // Remove client from map
                clients.delete(ws);

                if (user) {
                        console.log(`🔴 [LEAVE] ${user} disconnected`);

                        // Update online users list
                        broadcastUsers();
                }
        });

        /**
         * STEP 7.6
         * Handle WebSocket errors
         */
        ws.on('error', (err) => {
                console.error('❌ [WS ERROR]', err);
        });

        /**
         * STEP 7.7
         * Send welcome message to new client
         */
        ws.send(JSON.stringify({
                type: 'system',
                message: '🎉 Connected to WebSocket Chat Server'
        }));
});

/* ===================== ▶️ STEP 8: START SERVER ===================== */

/**
 * Start HTTP + WebSocket server
 */
const PORT = 8080;

server.listen(PORT, () => {
        console.log('===================================');
        console.log('✅ WebSocket Chat Server Started');
        console.log(`🌐 HTTP → http://localhost:${PORT}`);
        console.log(`🔌 WS   → ws://localhost:${PORT}`);
        console.log('===================================');
});

/* ===================== 🏁 END OF FILE ===================== */
