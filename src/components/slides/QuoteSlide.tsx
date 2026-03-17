'use client';

import { motion } from 'framer-motion';
import type { QuoteContent } from '@/lib/types';
import FitText from '../FitText';

export default function QuoteSlide({ content }: { content: QuoteContent }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-5 sm:px-10 relative overflow-hidden">
      {/* Accent glow */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.08] blur-[140px] pointer-events-none"
        style={{ background: content.accent }}
      />

      {/* Chapter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-6"
      >
        {content.chapter} &mdash; {content.heading}
      </motion.div>

      {/* Giant opening quote mark */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 0.12, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-[120px] leading-none font-serif select-none pointer-events-none"
        style={{ color: content.accent }}
      >
        &ldquo;
      </motion.div>

      {/* Quote text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl w-full -mt-10"
      >
        <FitText text={content.quote} min={18} max={44} className="font-semibold text-slate-800 text-center leading-snug">
          {content.quote}
        </FitText>
      </motion.div>

      {/* Attribution */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="mt-8 flex flex-col items-center gap-1"
      >
        <div className="w-10 h-0.5 rounded-full mb-2" style={{ background: content.accent }} />
        <span className="text-base font-semibold text-slate-700">{content.author}</span>
        {content.role && (
          <span className="text-sm text-slate-500">{content.role}</span>
        )}
        {content.year && (
          <span className="text-xs text-slate-400">{content.year}</span>
        )}
      </motion.div>

      {/* Context */}
      {content.context && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-sm text-slate-500 mt-6 text-center max-w-xl italic"
        >
          {content.context}
        </motion.p>
      )}
    </div>
  );
}
