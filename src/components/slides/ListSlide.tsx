'use client';

import { motion } from 'framer-motion';
import type { ListContent } from '@/lib/types';

export default function ListSlide({ content }: { content: ListContent }) {
  const items = content.items || [];
  const accent = content.accent || '#818cf8';

  return (
    <div className="flex flex-col h-full px-10 py-10">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <span className="text-xs font-medium tracking-widest uppercase text-slate-500">{content.chapter}</span>
        <h2 className="text-2xl font-bold text-white mt-1">{content.heading}</h2>
      </motion.div>

      <div className="flex-1 grid gap-3.5 auto-rows-fr" style={{
        gridTemplateColumns: items.length > 5 ? 'repeat(2, 1fr)' : '1fr',
      }}>
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
            className="flex items-start gap-4 rounded-xl border border-white/[0.06] p-4 relative overflow-hidden"
          >
            {/* Number */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
              style={{ background: `${accent}15`, color: accent }}
            >
              {i + 1}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-0.5">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
