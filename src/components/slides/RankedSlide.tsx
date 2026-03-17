'use client';

import { motion } from 'framer-motion';
import SlideIcon from '../SlideIcon';
import type { RankedContent } from '@/lib/types';

export default function RankedSlide({ content }: { content: RankedContent }) {
  const items = content.items || [];

  return (
    <div className="flex flex-col h-full slide-pad overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 shrink-0">
        <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">
          {content.chapter}
        </span>
        <h2 className="text-2xl font-bold text-slate-800 mt-1">{content.heading}</h2>
      </motion.div>

      <div className="space-y-4 flex-1 flex flex-col justify-center overflow-y-auto min-h-0">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
            className="rounded-xl border border-slate-200 p-4 relative overflow-hidden bg-white/60 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${item.color}10` }}
              >
                <SlideIcon name={item.icon} size={24} color={item.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-slate-800">{item.title}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{
                    color: item.color,
                    background: `${item.color}12`,
                  }}>
                    {item.percentLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2.5">{item.description}</p>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${item.color}, ${item.color}90)` }}
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
