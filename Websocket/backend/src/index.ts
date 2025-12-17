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
 * FLOW:
 * 1️⃣ Client connects
 * 2️⃣ Client sends "join" with name
 * 3️⃣ Server tracks user
 * 4️⃣ Messages broadcast with name + time
 * 5️⃣ Online users list updated on join/leave
 *************************************************************/

/* ===================== 📦 IMPORTS ===================== */

import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';

/* ===================== 🧠 TYPES ===================== */

type ClientInfo = {
        name: string;
};

/* ===================== 🌐 HTTP SERVER ===================== */

/**
 * Simple HTTP server (health check)
 */
const server = http.createServer((req, res) => {
        console.log(`🌍 [HTTP] ${req.method} ${req.url}`);

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('✅ WebSocket Chat Server is running\n');
});

/* ===================== 🔌 WEBSOCKET SERVER ===================== */

const wss = new WebSocketServer({ server });

/**
 * Store connected clients with their user info
 */
const clients = new Map<WebSocket, ClientInfo>();

/* ===================== 🔁 HELPER FUNCTIONS ===================== */

/**
 * Broadcast a message to all connected clients
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
 * Broadcast current online users list
 */
function broadcastUsers() {
        const users = Array.from(clients.values()).map(c => c.name);

        console.log(`🟢 [USERS] Online →`, users);

        broadcast({
                type: 'users',
                users
        });
}

/* ===================== 📡 CONNECTION HANDLING ===================== */

/**
 * EVENT: New WebSocket connection
 */
wss.on('connection', (ws: WebSocket, req) => {
        console.log(`🔗 [WS] Client connected from ${req.socket.remoteAddress}`);

        /**
         * EVENT: Message received
         */
        ws.on('message', (data) => {
                try {
                        const payload = JSON.parse(data.toString());

                        /* ---------- 👤 USER JOIN ---------- */
                        if (payload.type === 'join') {
                                clients.set(ws, { name: payload.name });

                                console.log(`👤 [JOIN] ${payload.name} joined the chat`);

                                broadcastUsers();
                                return;
                        }

                        /* ---------- 💬 CHAT MESSAGE ---------- */
                        if (payload.type === 'message') {
                                const sender = clients.get(ws)?.name || 'Unknown';

                                const chatMessage = {
                                        type: 'message',
                                        name: sender,
                                        message: payload.message,
                                        time: new Date().toLocaleTimeString()
                                };

                                console.log(`📩 [CHAT] ${sender}: ${payload.message}`);

                                broadcast(chatMessage);
                        }
                } catch (error) {
                        console.error('❌ [ERROR] Invalid message format', error);
                }
        });

        /**
         * EVENT: Client disconnects
         */
        ws.on('close', () => {
                const user = clients.get(ws)?.name;
                clients.delete(ws);

                if (user) {
                        console.log(`🔴 [LEAVE] ${user} disconnected`);
                        broadcastUsers();
                }
        });

        /**
         * EVENT: Error
         */
        ws.on('error', (err) => {
                console.error('❌ [WS ERROR]', err);
        });

        /**
         * Welcome message
         */
        ws.send(JSON.stringify({
                type: 'system',
                message: '🎉 Connected to WebSocket Chat Server'
        }));
});

/* ===================== ▶️ SERVER START ===================== */

const PORT = 8080;

server.listen(PORT, () => {
        console.log('===================================');
        console.log('✅ WebSocket Chat Server Started');
        console.log(`🌐 HTTP → http://localhost:${PORT}`);
        console.log(`🔌 WS   → ws://localhost:${PORT}`);
        console.log('===================================');
});

/* ===================== 🏁 END OF FILE ===================== */
