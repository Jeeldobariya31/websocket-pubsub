/**************************************************************
 * 📄 FILE: worker/src/index.ts
 *
 * 🚀 Code Execution Worker (Simulated)
 *************************************************************/

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

/* ===================== 🔌 REDIS ===================== */

const REDIS_URL = 'redis://localhost:6379';
const client: RedisClientType = createClient({ url: REDIS_URL });

async function connectRedis() {
        while (true) {
                try {
                        await client.connect();
                        console.log('✅ [WORKER] Redis connected');
                        break;
                } catch {
                        console.log('⏳ [WORKER] Retry Redis...');
                        await new Promise(res => setTimeout(res, 2000));
                }
        }
}

/* ===================== ⚙️ WORK LOOP ===================== */

async function main() {
        await connectRedis();

        while (true) {
                const res = await client.blPop('problems', 0);
                if (!res) continue;

                const payload: SubmitPayload = JSON.parse(res.element);

                console.log(
                        `⚙️ [WORKER] ${payload.username} → ${payload.problemTd}`
                );

                // Simulate execution time
                await new Promise(res => setTimeout(res, 1500));

                // Push result
                await client.rPush(
                        'results',
                        JSON.stringify({
                                userId: payload.userId,
                                username: payload.username,
                                problemTd: payload.problemTd,
                                status: 'Accepted ✅'
                        })
                );

                console.log(
                        `✅ [WORKER] Done → ${payload.username}`
                );
        }
}

main();
