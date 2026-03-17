'use client';

import { motion } from 'framer-motion';
import type { BigStatementContent } from '@/lib/types';
import FitText from '../FitText';

export default function BigStatementSlide({ content }: { content: BigStatementContent }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 sm:px-12 relative overflow-hidden">
      {/* Soft glow backdrop */}
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

      {/* Statement */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl w-full"
      >
        <FitText text={content.statement} min={20} max={56} className="font-black text-center text-slate-800 leading-tight">
          {content.statement}
        </FitText>
      </motion.div>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="text-base sm:text-lg text-slate-500 mt-8 text-center max-w-2xl leading-relaxed"
      >
        {content.description}
      </motion.p>

      {/* Source */}
      {content.source && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-xs text-slate-400 mt-5 italic"
        >
          {content.source}
        </motion.span>
      )}
    </div>
  );
}
