'use client';

import { motion } from 'framer-motion';
import type { ComparisonContent } from '@/lib/types';

export default function ComparisonSlide({ content }: { content: ComparisonContent }) {
  const columns = content.columns || [];

  return (
    <div className="flex flex-col h-full slide-pad overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 sm:mb-6 shrink-0">
        <span className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-slate-400">{content.chapter}</span>
        <h2 className="text-lg sm:text-2xl font-bold text-slate-800 mt-1">{content.heading}</h2>
      </motion.div>

      <div className="flex-1 grid gap-3 sm:gap-5 min-h-0" style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(min(160px, 100%), 1fr))`,
      }}>
        {columns.map((col, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
            className="rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden flex flex-col bg-white/60 shadow-sm"
          >
            {/* Column header */}
            <div
              className="px-3 sm:px-5 py-2 sm:py-4 border-b border-slate-200"
              style={{ background: `${col.color}08` }}
            >
              <div className="w-8 h-1 rounded-full mb-3" style={{ background: col.color }} />
              <h3 className="text-base font-bold text-slate-800">{col.title}</h3>
            </div>

            {/* Points */}
            <div className="px-3 sm:px-5 py-2 sm:py-4 space-y-2 sm:space-y-3 flex-1 overflow-y-auto">
              {col.points.map((point, j) => (
                <motion.div
                  key={j}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.15 + j * 0.08 }}
                  className="flex items-start gap-2 text-[11px] sm:text-sm text-slate-600"
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
