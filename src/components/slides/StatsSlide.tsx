'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import SlideIcon from '../SlideIcon';
import type { StatsContent } from '@/lib/types';

function AnimatedCounter({ target, suffix, delay }: { target: number; suffix?: string; delay: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<number>(undefined);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 1500;
      const start = performance.now();
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setVal(Math.round(eased * target));
        if (progress < 1) ref.current = requestAnimationFrame(animate);
      };
      ref.current = requestAnimationFrame(animate);
    }, delay);
    return () => {
      clearTimeout(timeout);
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [target, delay]);

  return (
    <span>
      {val.toLocaleString()}
      {suffix || ''}
    </span>
  );
}

export default function StatsSlide({ content }: { content: StatsContent }) {
  const items = content.items || [];
  const cols = items.length <= 2 ? 2 : items.length <= 4 ? 2 : 3;

  return (
    <div className="flex flex-col h-full px-10 py-10 overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 shrink-0">
        <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">
          {content.chapter}
        </span>
        <h2 className="text-2xl font-bold text-slate-800 mt-1">{content.heading}</h2>
      </motion.div>

      <div
        className="grid gap-5 flex-1 auto-rows-fr min-h-0"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
            className="rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden bg-white/60 shadow-sm"
          >
            <div className="mb-3">
              <SlideIcon name={item.icon} size={32} color={item.color} />
            </div>
            <div className="text-4xl sm:text-5xl font-black" style={{ color: item.color }}>
              <AnimatedCounter target={item.value} suffix={item.suffix} delay={500 + i * 200} />
            </div>
            <div className="text-sm text-slate-500 mt-2">{item.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
