'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';

type SSEHandler = (data: any) => void;

export function useSSE() {
    const { data: session } = useSession();
    const esRef = useRef<EventSource | null>(null);
    const handlersRef = useRef<Map<string, Set<SSEHandler>>>(new Map());
    const retryDelayRef = useRef(1000);

    const subscribe = useCallback((eventType: string, handler: SSEHandler) => {
        if (!handlersRef.current.has(eventType)) {
            handlersRef.current.set(eventType, new Set());
        }
        handlersRef.current.get(eventType)!.add(handler);
        return () => {
            handlersRef.current.get(eventType)?.delete(handler);
        };
    }, []);

    useEffect(() => {
        if (!session) return;

        let cancelled = false;

        const connect = () => {
            if (cancelled) return;
            const es = new EventSource('/api/events');
            esRef.current = es;

            es.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    const handlers = handlersRef.current.get(payload.type);
                    handlers?.forEach(h => h(payload));
                } catch {}
            };

            es.onerror = () => {
                es.close();
                if (!cancelled) {
                    setTimeout(connect, retryDelayRef.current);
                    retryDelayRef.current = Math.min(retryDelayRef.current * 2, 30_000);
                }
            };

            es.onopen = () => {
                retryDelayRef.current = 1000;
            };
        };

        connect();

        return () => {
            cancelled = true;
            esRef.current?.close();
        };
    }, [session]);

    return { subscribe };
}
