import { useEffect, useRef, useState } from "react";

/**
 * Countdown timer for "time attack" style rounds. Restarts automatically
 * whenever `resetKey` changes. Calls `onExpire` once when it hits zero
 * while `active` is true.
 */
export function useRoundTimer(
  active: boolean,
  durationMs: number,
  resetKey: unknown,
  onExpire: () => void,
): number {
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setRemainingMs(durationMs);
    if (!active) return;
    const start = performance.now();
    const id = window.setInterval(() => {
      const elapsed = performance.now() - start;
      const remain = Math.max(0, durationMs - elapsed);
      setRemainingMs(remain);
      if (remain <= 0) {
        window.clearInterval(id);
        onExpireRef.current();
      }
    }, 100);
    return () => window.clearInterval(id);
    // resetKey intentionally retriggers the effect to restart the countdown
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, durationMs, resetKey]);

  return remainingMs;
}
