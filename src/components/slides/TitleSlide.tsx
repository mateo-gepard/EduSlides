'use client';

import { motion } from 'framer-motion';
import type { TitleContent } from '@/lib/types';

export default function TitleSlide({ content }: { content: TitleContent }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-12 relative overflow-hidden">
      {/* Decorative rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full border border-white/[0.03] absolute" />
        <div className="w-[400px] h-[400px] rounded-full border border-white/[0.05] absolute" />
        <div className="w-[200px] h-[200px] rounded-full border border-white/[0.04] absolute" />
      </div>

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs font-medium tracking-widest uppercase text-indigo-300 mb-8"
      >
        {content.badge}
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.05] max-w-4xl"
      >
        {content.title}
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="text-lg sm:text-xl text-slate-400 mt-5 max-w-2xl leading-relaxed"
      >
        {content.subtitle}
      </motion.p>

      {/* Meta pills */}
      {content.meta?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-10"
        >
          {content.meta.map((m, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-slate-300"
            >
              <span className="text-base">{m.icon}</span>
              {m.text}
            </span>
          ))}
        </motion.div>
      )}
    </div>
  );
}
