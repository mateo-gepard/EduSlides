'use client';

import { motion } from 'framer-motion';
import type { ListContent } from '@/lib/types';

export default function ListSlide({ content }: { content: ListContent }) {
  const items = content.items || [];
  const accent = content.accent || '#6366f1';

  return (
    <div className="flex flex-col h-full px-10 py-10 overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 shrink-0">
        <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">{content.chapter}</span>
        <h2 className="text-2xl font-bold text-slate-800 mt-1">{content.heading}</h2>
      </motion.div>

      <div className="flex-1 grid gap-3 auto-rows-fr min-h-0" style={{
        gridTemplateColumns: items.length > 5 ? 'repeat(2, 1fr)' : '1fr',
      }}>
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
            className="flex items-start gap-4 rounded-xl border border-slate-200 p-4 relative overflow-hidden bg-white/60 shadow-sm"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
              style={{ background: `${accent}12`, color: accent }}
            >
              {i + 1}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800 mb-0.5">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
