'use client';

import { motion } from 'framer-motion';
import type { FunFactContent } from '@/lib/types';
import SlideIcon from '../SlideIcon';

export default function FunFactSlide({ content }: { content: FunFactContent }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-10 relative overflow-hidden">
      {/* Big glow */}
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

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm"
        style={{ background: `${content.accent}15` }}
      >
        <SlideIcon name={content.icon} size={40} color={content.accent} />
      </motion.div>

      {/* "Did you know?" label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-sm font-bold uppercase tracking-wider mb-4"
        style={{ color: content.accent }}
      >
        Did you know?
      </motion.div>

      {/* The fact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm px-8 py-6 max-w-3xl text-center"
      >
        <p className="text-xl sm:text-2xl font-semibold text-slate-800 leading-snug">
          {content.fact}
        </p>
      </motion.div>

      {/* Explanation */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="text-base text-slate-500 mt-6 text-center max-w-2xl leading-relaxed"
      >
        {content.explanation}
      </motion.p>

      {/* Source */}
      {content.source && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="text-xs text-slate-400 mt-4 italic"
        >
          {content.source}
        </motion.span>
      )}
    </div>
  );
}
