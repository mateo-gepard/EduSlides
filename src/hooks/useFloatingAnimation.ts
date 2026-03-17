'use client';

import { useMemo } from 'react';

interface FloatingConfig {
  /** How many pixels to drift in x/y (default 4) */
  range?: number;
  /** Duration of one full cycle in seconds (default 6) */
  duration?: number;
  /** Delay offset in seconds (use index to stagger) */
  delay?: number;
  /** Also do a subtle scale pulse (default true) */
  pulse?: boolean;
}

/**
 * Returns Framer‑Motion animate+transition props that make any element
 * gently float. Spread them on a <motion.div>.
 *
 * Example:
 *   const float = useFloatingAnimation({ delay: index * 0.5 });
 *   <motion.div {...float}>…</motion.div>
 */
export function useFloatingAnimation(cfg: FloatingConfig = {}) {
  const { range = 4, duration = 6, delay = 0, pulse = true } = cfg;

  return useMemo(() => ({
    animate: {
      y: [0, -range, 0, range * 0.5, 0],
      x: [0, range * 0.3, 0, -range * 0.3, 0],
      ...(pulse ? { scale: [1, 1.02, 1, 0.98, 1] } : {}),
    },
    transition: {
      duration,
      delay,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'loop' as const,
    },
  }), [range, duration, delay, pulse]);
}

/**
 * Returns CSS animation string for use with plain elements (no Framer Motion needed).
 * Uses the CSS keyframe `floatGentle` from globals.css.
 */
export function useFloatingCSS(cfg: { duration?: number; delay?: number } = {}) {
  const { duration = 6, delay = 0 } = cfg;
  return useMemo(() => ({
    animation: `floatGentle ${duration}s ${delay}s ease-in-out infinite`,
  }), [duration, delay]);
}
