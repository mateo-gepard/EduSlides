'use client';

import { motion } from 'framer-motion';
import type { InfoGridContent } from '@/lib/types';

export default function InfoGridSlide({ content }: { content: InfoGridContent }) {
  const count = content.cards?.length || 0;
  const cols = count <= 2 ? 2 : count <= 4 ? 2 : 3;

  return (
    <div className="flex flex-col h-full px-10 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <span className="text-xs font-medium tracking-widest uppercase text-slate-500">
          {content.chapter}
        </span>
        <h2 className="text-3xl font-bold text-white mt-1">{content.heading}</h2>
      </motion.div>

      {/* Cards grid */}
      <div
        className="grid gap-4 flex-1 auto-rows-fr"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {content.cards?.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
            className="rounded-2xl p-5 flex flex-col border border-white/[0.06] relative overflow-hidden"
            style={{ background: `${card.color}08` }}
          >
            {/* Accent bar */}
            <div
              className="absolute top-0 left-0 w-full h-[2px]"
              style={{ background: `linear-gradient(90deg, ${card.color}, transparent)` }}
            />

            {/* Icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
              style={{ background: `${card.color}15` }}
            >
              {card.icon}
            </div>

            <h3 className="text-sm font-semibold text-white mb-1.5">{card.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed flex-1">{card.text}</p>

            {card.highlight && (
              <div
                className="mt-3 px-3 py-2 rounded-lg text-xs border"
                style={{
                  background: `${card.color}08`,
                  borderColor: `${card.color}20`,
                  color: card.color,
                }}
              >
                <span className="font-semibold">{card.highlight.text}</span>
                {card.highlight.source && (
                  <span className="block text-slate-500 text-[10px] mt-0.5">
                    {card.highlight.source}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
