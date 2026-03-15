'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { FormulaContent } from '@/lib/types';
import katex from 'katex';

function KaTeX({ math, display = false, className = '' }: { math: string; display?: boolean; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(math, ref.current, {
        displayMode: display,
        throwOnError: false,
        trust: false,
        strict: false,
      });
    } catch {
      if (ref.current) ref.current.textContent = math;
    }
  }, [math, display]);
  return <span ref={ref} className={className} />;
}

export default function FormulaSlide({ content }: { content: FormulaContent }) {
  const steps = content.steps || [];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 relative overflow-hidden">
      {/* Glow */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-10 blur-[120px] pointer-events-none"
        style={{ background: content.accent }}
      />

      {/* Chapter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-3"
      >
        {content.chapter} &mdash; {content.heading}
      </motion.div>

      {/* Main formula */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 px-10 py-8 mb-6"
      >
        <KaTeX math={content.formula} display className="text-3xl sm:text-4xl lg:text-5xl text-slate-800" />
      </motion.div>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-base text-slate-500 text-center max-w-2xl leading-relaxed mb-6"
      >
        {content.description}
      </motion.p>

      {/* Derivation steps */}
      {steps.length > 0 && (
        <div className="flex flex-col gap-3 w-full max-w-3xl overflow-y-auto max-h-[40%] min-h-0">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + i * 0.2 }}
              className="flex items-start gap-4 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm px-5 py-3"
            >
              <span
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: content.accent }}
              >
                {step.label || i + 1}
              </span>
              <div className="flex flex-col gap-1 min-w-0">
                <KaTeX math={step.formula} display className="text-lg text-slate-800" />
                <span className="text-sm text-slate-500">{step.explanation}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
