'use client';

import { motion } from 'framer-motion';
import type { RankedContent } from '@/lib/types';

export default function RankedSlide({ content }: { content: RankedContent }) {
  const items = content.items || [];

  return (
    <div className="flex flex-col h-full px-10 py-10">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <span className="text-xs font-medium tracking-widest uppercase text-slate-500">
          {content.chapter}
        </span>
        <h2 className="text-2xl font-bold text-white mt-1">{content.heading}</h2>
      </motion.div>

      <div className="space-y-4 flex-1 flex flex-col justify-center">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
            className="rounded-xl border border-white/[0.06] p-4 relative overflow-hidden"
            style={{ background: `${item.color}05` }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: `${item.color}12` }}
              >
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{
                    color: item.color,
                    background: `${item.color}15`,
                  }}>
                    {item.percentLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2.5">{item.description}</p>
                {/* Bar */}
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${item.color}, ${item.color}80)` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percent}%` }}
                    transition={{ delay: 0.6 + i * 0.12, duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
