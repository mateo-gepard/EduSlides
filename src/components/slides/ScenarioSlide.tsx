'use client';

import { motion } from 'framer-motion';
import type { ScenarioContent } from '@/lib/types';

export default function ScenarioSlide({ content }: { content: ScenarioContent }) {
  const steps = content.steps || [];

  return (
    <div className="flex flex-col h-full px-10 py-10">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
        <span className="text-xs font-medium tracking-widest uppercase text-slate-500">{content.chapter}</span>
        <h2 className="text-2xl font-bold text-white mt-1">{content.heading}</h2>
      </motion.div>

      {/* Subject card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] p-4 flex items-start gap-4 mb-5"
      >
        <div className="text-3xl">{content.subject.icon}</div>
        <div>
          <h3 className="text-sm font-bold text-indigo-300">{content.subject.title}</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{content.subject.description}</p>
        </div>
      </motion.div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.12, duration: 0.4 }}
            className="rounded-xl border border-white/[0.06] p-4 relative overflow-hidden"
          >
            {/* Color accent */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
              style={{ background: step.color }}
            />
            <div className="pl-3">
              <span
                className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold mb-2"
                style={{ background: `${step.color}15`, color: step.color }}
              >
                {step.badge}
              </span>
              <p className="text-sm text-slate-300 leading-relaxed">{step.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
