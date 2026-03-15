'use client';

import { motion } from 'framer-motion';
import SlideIcon from '../SlideIcon';
import type { ScenarioContent } from '@/lib/types';

export default function ScenarioSlide({ content }: { content: ScenarioContent }) {
  const steps = content.steps || [];

  return (
    <div className="flex flex-col h-full px-10 py-10 overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 shrink-0">
        <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">{content.chapter}</span>
        <h2 className="text-2xl font-bold text-slate-800 mt-1">{content.heading}</h2>
      </motion.div>

      {/* Subject card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 flex items-start gap-4 mb-5 shrink-0 shadow-sm"
      >
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
          <SlideIcon name={content.subject.icon} size={22} className="text-indigo-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-indigo-700">{content.subject.title}</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{content.subject.description}</p>
        </div>
      </motion.div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.12, duration: 0.4 }}
            className="rounded-xl border border-slate-200 p-4 relative overflow-hidden bg-white/60 shadow-sm"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: step.color }} />
            <div className="pl-3">
              <span
                className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold mb-2"
                style={{ background: `${step.color}12`, color: step.color }}
              >
                {step.badge}
              </span>
              <p className="text-sm text-slate-600 leading-relaxed">{step.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
