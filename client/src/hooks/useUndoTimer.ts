import { useCallback, useEffect, useRef, useState } from 'react';

export const UNDO_DURATION_MS = 8_000;

export interface UndoTimer {
  serviceId: number;
  expiresAt: number;
}

export interface UseUndoTimerResult {
  activeTimers: UndoTimer[];
  start: (serviceId: number, onExpire: () => void | Promise<void>) => number;
  cancel: (serviceId: number) => void;
}

export function useUndoTimer(): UseUndoTimerResult {
  const timers = useRef(new Map<number, number>());
  const [activeTimers, setActiveTimers] = useState<UndoTimer[]>([]);

  const cancel = useCallback((serviceId: number): void => {
    const timeout = timers.current.get(serviceId);
    if (timeout !== undefined) window.clearTimeout(timeout);
    timers.current.delete(serviceId);
    setActiveTimers((current) => current.filter((timer) => timer.serviceId !== serviceId));
  }, []);

  const start = useCallback((serviceId: number, onExpire: () => void | Promise<void>): number => {
    const expiresAt = Date.now() + UNDO_DURATION_MS;
    const existing = timers.current.get(serviceId);
    if (existing !== undefined) window.clearTimeout(existing);

    const timeout = window.setTimeout(() => {
      timers.current.delete(serviceId);
      setActiveTimers((current) => current.filter((timer) => timer.serviceId !== serviceId));

      try {
        const result = onExpire();
        if (result instanceof Promise) {
          void result.catch(() => undefined);
        }
      } catch {
        // Timer cleanup has already happened; ignore expiration errors after the deadline.
      }
    }, UNDO_DURATION_MS);

    timers.current.set(serviceId, timeout);
    setActiveTimers((current) => [
      ...current.filter((timer) => timer.serviceId !== serviceId),
      { serviceId, expiresAt },
    ]);
    return expiresAt;
  }, []);

  useEffect(() => () => {
    timers.current.forEach((timeout) => window.clearTimeout(timeout));
    timers.current.clear();
  }, []);

  return { activeTimers, start, cancel };
}
