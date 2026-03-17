'use client';

import { motion } from 'framer-motion';
import SlideIcon from '../SlideIcon';
import type { InfoGridContent } from '@/lib/types';

export default function InfoGridSlide({ content }: { content: InfoGridContent }) {
  const count = content.cards?.length || 0;
  const cols = count <= 2 ? 2 : count <= 4 ? 2 : 3;

  return (
    <div className="flex flex-col h-full slide-pad overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 sm:mb-6 shrink-0"
      >
        <span className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-slate-400">
          {content.chapter}
        </span>
        <h2 className="text-xl sm:text-3xl font-bold text-slate-800 mt-1">{content.heading}</h2>
      </motion.div>

      {/* Cards grid — auto-reflow on small viewports */}
      <div
        className="grid gap-2 sm:gap-4 flex-1 auto-rows-fr min-h-0"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(140px, 100%), 1fr))` }}
      >
        {content.cards?.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
            className="rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col border border-slate-200 relative overflow-hidden bg-white/60 shadow-sm backdrop-blur-sm"
          >
            {/* Accent bar */}
            <div
              className="absolute top-0 left-0 w-full h-[3px]"
              style={{ background: `linear-gradient(90deg, ${card.color}, transparent)` }}
            />

            <div
              className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3"
              style={{ background: `${card.color}15` }}
            >
              <SlideIcon name={card.icon} size={16} color={card.color} />
            </div>

            <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-1">{card.title}</h3>
            <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed flex-1">{card.text}</p>

            {card.highlight && (
              <div
                className="mt-3 px-3 py-2 rounded-lg text-xs border"
                style={{
                  background: `${card.color}08`,
                  borderColor: `${card.color}25`,
                  color: card.color,
                }}
              >
                <span className="font-semibold">{card.highlight.text}</span>
                {card.highlight.source && (
                  <span className="block text-slate-400 text-[10px] mt-0.5">
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
