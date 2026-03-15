'use client';

import { motion } from 'framer-motion';
import type { OutroContent } from '@/lib/types';

export default function OutroSlide({ content }: { content: OutroContent }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-12 text-center relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-5xl mb-6"
      >
        {content.icon}
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-3xl sm:text-4xl font-bold text-white mb-4"
      >
        {content.title}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-base text-slate-400 max-w-xl leading-relaxed mb-10"
      >
        {content.message}
      </motion.p>

      {/* Sources */}
      {content.sources?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <h4 className="text-xs font-semibold text-slate-500 tracking-widest uppercase mb-3">Sources</h4>
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2">
            {content.sources.map((src, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 + i * 0.05 }}
                className="text-[11px] text-slate-600 leading-relaxed text-left"
              >
                [{i + 1}] {src}
              </motion.p>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
