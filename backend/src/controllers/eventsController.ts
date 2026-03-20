import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { redis } from '../config';

export const sseHandler = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth!.payload.sub;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const channel = `user:${userId}`;
    const subscriber = redis.duplicate();

    try {
        await subscriber.subscribe(channel);
    } catch (err) {
        console.error('[SSE] Redis subscribe failed:', err);
        subscriber.quit();
        res.write('data: {"type":"error","reason":"service_unavailable"}\n\n');
        res.end();
        return;
    }

    const heartbeat = setInterval(() => {
        res.write(': heartbeat\n\n');
    }, 30_000);

    subscriber.on('message', (_chan: string, message: string) => {
        res.write(`data: ${message}\n\n`);
    });

    req.on('close', () => {
        clearInterval(heartbeat);
        subscriber.unsubscribe(channel).then(() => subscriber.quit());
    });
};
