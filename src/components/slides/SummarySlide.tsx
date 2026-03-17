'use client';

import { motion } from 'framer-motion';
import SlideIcon from '../SlideIcon';
import type { SummaryContent } from '@/lib/types';

export default function SummarySlide({ content }: { content: SummaryContent }) {
  const items = content.items || [];
  const cols = items.length <= 4 ? 2 : 3;

  return (
    <div className="flex flex-col h-full slide-pad overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 text-center shrink-0">
        <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">{content.chapter}</span>
        <h2 className="text-2xl font-bold text-slate-800 mt-1">{content.heading}</h2>
      </motion.div>

      <div
        className="grid gap-2 sm:gap-4 flex-1 auto-rows-fr min-h-0"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(140px, 100%), 1fr))` }}
      >
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
            className="rounded-xl border border-slate-200 p-4 bg-white/60 flex items-start gap-3 shadow-sm"
          >
            <div className="shrink-0 mt-0.5">
              <SlideIcon name={item.icon} size={20} className="text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-0.5">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
