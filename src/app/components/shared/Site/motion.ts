import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

// The design's signature ease-out, used by almost every entrance.
export const EASE = [0.16, 1, 0.3, 1] as const;

/** Entrance travel distance in px (the design's "showy" level); none for reduced motion. */
export function useRevealDistance(distance = 26) {
  return useReducedMotion() ? 0 : distance;
}

/** Counts from 0 up to `to` (ease-out cubic) once `enabled`, after an optional delay. */
export function useCountUp(
  to: number,
  {
    delayMs = 0,
    durationSec,
    enabled = true,
    decimals = 0,
  }: { delayMs?: number; durationSec: number; enabled?: boolean; decimals?: number },
) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let raf = 0;
    const factor = Math.pow(10, decimals);
    const timer = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / (durationSec * 1000), 1);
        setValue(Math.round(to * (1 - Math.pow(1 - progress, 3)) * factor) / factor);
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [to, delayMs, durationSec, enabled, decimals]);

  return value;
}
