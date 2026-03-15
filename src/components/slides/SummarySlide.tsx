'use client';

import { motion } from 'framer-motion';
import type { SummaryContent } from '@/lib/types';

export default function SummarySlide({ content }: { content: SummaryContent }) {
  const items = content.items || [];
  const cols = items.length <= 4 ? 2 : 3;

  return (
    <div className="flex flex-col h-full px-10 py-10">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 text-center">
        <span className="text-xs font-medium tracking-widest uppercase text-slate-500">{content.chapter}</span>
        <h2 className="text-2xl font-bold text-white mt-1">{content.heading}</h2>
      </motion.div>

      <div
        className="grid gap-4 flex-1 auto-rows-fr"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
            className="rounded-xl border border-white/[0.06] p-4 bg-white/[0.02] flex items-start gap-3"
          >
            <div className="text-xl">{item.icon}</div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-0.5">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
