'use client';

import { motion } from 'framer-motion';
import type { TimelineContent } from '@/lib/types';

export default function TimelineSlide({ content }: { content: TimelineContent }) {
  const events = content.events || [];

  return (
    <div className="flex h-full px-8 py-8 gap-6">
      {/* Timeline column */}
      <div className="flex-1 flex flex-col min-w-0">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5">
          <span className="text-xs font-medium tracking-widest uppercase text-slate-500">{content.chapter}</span>
          <h2 className="text-2xl font-bold text-white mt-1">{content.heading}</h2>
        </motion.div>

        <div className="flex-1 overflow-y-auto pr-2 relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-white/[0.06]" />

          <div className="space-y-4 pl-14 relative">
            {events.map((ev, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
                className="relative"
              >
                {/* Dot on line */}
                <div
                  className="absolute -left-[2.65rem] top-3 w-3 h-3 rounded-full border-2"
                  style={{ borderColor: ev.color, background: `${ev.color}30` }}
                />

                {/* Time badge */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold"
                    style={{ background: `${ev.color}15`, color: ev.color }}
                  >
                    <span>{ev.icon}</span>
                    {ev.time}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1">{ev.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{ev.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Side bar chart */}
      {content.sideChart && (
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="w-64 shrink-0 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 flex flex-col"
        >
          <h3 className="text-sm font-bold text-white mb-1">{content.sideChart.title}</h3>
          {content.sideChart.source && (
            <p className="text-[10px] text-slate-600 mb-4">{content.sideChart.source}</p>
          )}
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {content.sideChart.bars.map((bar, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">{bar.label}</span>
                  <span className="font-mono text-white">{bar.displayValue}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: bar.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${bar.percent}%` }}
                    transition={{ delay: 1.0 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
