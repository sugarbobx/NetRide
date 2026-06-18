import { useState, useEffect, useCallback } from 'react';
import { set as idbSet, get as idbGet, del as idbDel } from 'idb-keyval';

const QUEUE_KEY = 'netride_offline_queue';

/**
 * Feature 2: Monitors network status and queues actions when offline.
 * When reconnected, fires all queued items in order.
 *
 * @param {Function} flushFn - async (item) => void — called per queued item on reconnect
 * @returns {{ isOnline, enqueue }}
 */
export function useOffline(flushFn) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const flush = useCallback(async () => {
    const queue = (await idbGet(QUEUE_KEY)) || [];
    if (!queue.length) return;
    await idbDel(QUEUE_KEY);
    for (const item of queue) {
      try { await flushFn(item); } catch { /* best-effort */ }
    }
  }, [flushFn]);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      flush();
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [flush]);

  const enqueue = useCallback(async (item) => {
    const queue = (await idbGet(QUEUE_KEY)) || [];
    queue.push(item);
    await idbSet(QUEUE_KEY, queue);
  }, []);

  return { isOnline, enqueue };
}
