'use client';

import { motion } from 'framer-motion';
import type { ProcessContent } from '@/lib/types';

export default function ProcessSlide({ content }: { content: ProcessContent }) {
  const steps = content.steps || [];

  return (
    <div className="flex flex-col h-full px-10 py-10 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 shrink-0"
      >
        <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">
          {content.chapter}
        </span>
        <h2 className="text-2xl font-bold text-slate-800 mt-1">{content.heading}</h2>
        {content.description && (
          <p className="text-sm text-slate-500 mt-2 max-w-xl">{content.description}</p>
        )}
      </motion.div>

      <div className="flex-1 flex items-center min-h-0">
        <div className="grid gap-4 w-full" style={{
          gridTemplateColumns: `repeat(${Math.min(steps.length, 5)}, 1fr)`,
        }}>
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-2xl p-5 border border-slate-200 flex flex-col bg-white/60 shadow-sm"
            >
              {/* Arrow connector */}
              {i < steps.length - 1 && (
                <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 z-10 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6H10M10 6L6 2M10 6L6 10" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}

              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black mb-3"
                style={{ background: `${step.color}15`, color: step.color }}
              >
                {step.label}
              </div>

              <h3 className="text-sm font-bold text-slate-800 mb-1.5">{step.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>

              <div
                className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                style={{ background: `linear-gradient(90deg, ${step.color}50, transparent)` }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
