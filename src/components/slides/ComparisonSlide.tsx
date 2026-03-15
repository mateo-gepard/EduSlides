'use client';

import { motion } from 'framer-motion';
import type { ComparisonContent } from '@/lib/types';

export default function ComparisonSlide({ content }: { content: ComparisonContent }) {
  const columns = content.columns || [];

  return (
    <div className="flex flex-col h-full px-10 py-10">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <span className="text-xs font-medium tracking-widest uppercase text-slate-500">{content.chapter}</span>
        <h2 className="text-2xl font-bold text-white mt-1">{content.heading}</h2>
      </motion.div>

      <div className="flex-1 grid gap-5" style={{
        gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
      }}>
        {columns.map((col, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
            className="rounded-2xl border border-white/[0.06] overflow-hidden flex flex-col"
            style={{ background: `${col.color}05` }}
          >
            {/* Column header */}
            <div
              className="px-5 py-4 border-b border-white/[0.06]"
              style={{ background: `${col.color}08` }}
            >
              <div className="w-8 h-1 rounded-full mb-3" style={{ background: col.color }} />
              <h3 className="text-base font-bold text-white">{col.title}</h3>
            </div>

            {/* Points */}
            <div className="px-5 py-4 space-y-3 flex-1">
              {col.points.map((point, j) => (
                <motion.div
                  key={j}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.15 + j * 0.08 }}
                  className="flex items-start gap-2.5 text-sm text-slate-300"
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: col.color }}
                  />
                  {point}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
