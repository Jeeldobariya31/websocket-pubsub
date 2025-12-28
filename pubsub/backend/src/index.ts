/**************************************************************
 * 📄 FILE: backend/src/index.ts
 *
 * 🚀 Mini-LeetCode Backend
 * - Accept submissions
 * - Push jobs to Redis queue
 * - Send live results via WebSocket
 *************************************************************/

import express from 'express';
import cors from 'cors';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

/* ===================== 🧠 TYPES ===================== */

type SubmitPayload = {
        userId: string;
        username: string;
        problemTd: string;
        code: string;
        language: string;
};

type ResultPayload = {
        userId: string;
        username: string;
        problemTd: string;
        status: string;
};

/* ===================== 🔌 REDIS ===================== */

const REDIS_URL = 'redis://localhost:6379';
let redisClient: RedisClientType;
let resultSubscriber: RedisClientType;

/**
 * Connect Redis (publisher + subscriber)
 */
async function connectRedis() {
        redisClient = createClient({ url: REDIS_URL });
        resultSubscriber = redisClient.duplicate();

        await redisClient.connect();
        await resultSubscriber.connect();

        console.log('✅ [REDIS] Connected');
}

/* ===================== 🌐 EXPRESS ===================== */

const app = express();

/**
 * 🔥 CORS MIDDLEWARE (VERY IMPORTANT)
 * Allows frontend (localhost:8000) to call backend (localhost:4000)
 */
app.use(
        cors({
                origin: '*',
                methods: ['GET', 'POST', 'OPTIONS'],
                allowedHeaders: ['Content-Type'],
        })
);

/**
 * Parse JSON request bodies
 */
app.use(express.json());

/**
 * Health check route
 */
app.get('/', (_req, res) => {
        res.send('✅ Backend running');
});

/* ===================== 🔌 HTTP + WS ===================== */

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

/**
 * Store active WebSocket connections
 * key → userId
 */
const wsClients = new Map<string, WebSocket>();

/* ===================== 🔁 WEBSOCKET ===================== */

wss.on('connection', (ws) => {
        console.log('🔌 [WS] Client connected');

        ws.on('message', (data) => {
                const msg = JSON.parse(data.toString());

                /**
                 * Client registers itself after WS connect
                 */
                if (msg.type === 'register') {
                        wsClients.set(msg.userId, ws);
                        console.log(
                                `👤 [WS] Registered ${msg.username} (${msg.userId})`
                        );
                }
        });

        ws.on('close', () => {
                wsClients.forEach((client, userId) => {
                        if (client === ws) wsClients.delete(userId);
                });
        });
});

/* ===================== 📤 SUBMIT (ONLY ONE ROUTE) ===================== */
/**
 * Receives submission from frontend
 * Pushes job into Redis queue
 */
app.post('/submit', async (req, res) => {
        try {
                console.log('🔥 /submit HIT', req.body);

                const payload: SubmitPayload = req.body;

                // Basic validation
                if (!payload.userId || !payload.username || !payload.problemTd) {
                        return res.status(400).json({ message: 'Missing fields' });
                }

                /**
                 * Push job to Redis queue
                 */
                await redisClient.rPush(
                        'problems',
                        JSON.stringify(payload)
                );

                console.log(
                        `📤 [QUEUE] ${payload.username} (${payload.userId}) → ${payload.problemTd}`
                );

                res.json({ message: '✅ Submitted' });
        } catch (err) {
                console.error('🔥 [SUBMIT ERROR]', err);
                res.status(500).json({ message: 'Server error' });
        }
});

/* ===================== 📡 RESULT LISTENER ===================== */
/**
 * Listens for worker results
 * Sends result instantly via WebSocket
 */
async function listenForResults() {
        const res = await resultSubscriber.blPop('results', 0);
        if (!res) return;

        const result: ResultPayload = JSON.parse(res.element);
        const ws = wsClients.get(result.userId);

        if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(result));
                console.log(`📨 [WS] Result sent → ${result.username}`);
        }

        listenForResults(); // keep listening forever
}

/* ===================== ▶️ START SERVER ===================== */

async function start() {
        await connectRedis();
        listenForResults();

        server.listen(4000, () => {
                console.log('=================================');
                console.log('🚀 Backend running');
                console.log('🌐 HTTP → http://localhost:4000');
                console.log('🔌 WS   → ws://localhost:4000');
                console.log('=================================');
        });
}

start();
