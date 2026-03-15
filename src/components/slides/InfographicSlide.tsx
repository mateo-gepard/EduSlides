'use client';

import { motion } from 'framer-motion';
import type { InfographicContent } from '@/lib/types';
import SlideIcon from '../SlideIcon';

export default function InfographicSlide({ content }: { content: InfographicContent }) {
  const items = content.items || [];
  const isHorizontal = content.layout === 'horizontal';
  const isCentered = content.layout === 'centered';

  return (
    <div className="flex flex-col h-full px-6 py-5 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 mb-4">
        <div className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-1">
          {content.chapter} &mdash; {content.heading}
        </div>
      </div>

      {/* Items */}
      <div
        className={`flex-1 min-h-0 flex ${
          isHorizontal
            ? 'flex-row items-center justify-center gap-4 overflow-x-auto'
            : isCentered
            ? 'flex-wrap items-center justify-center gap-5 overflow-y-auto'
            : 'flex-col items-center justify-center gap-4 overflow-y-auto'
        } px-2`}
      >
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`flex ${
              isHorizontal ? 'flex-col items-center text-center' : 'flex-row items-center gap-5'
            } bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm p-5 ${
              isHorizontal ? 'min-w-[180px] max-w-[220px]' : 'w-full max-w-2xl'
            }`}
          >
            {/* Icon + Value */}
            <div className={`shrink-0 flex flex-col items-center ${isHorizontal ? 'mb-3' : ''}`}>
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-2"
                style={{ background: `${item.color}18` }}
              >
                <SlideIcon name={item.icon} size={28} color={item.color} />
              </div>
              <span className="text-2xl font-black" style={{ color: item.color }}>
                {item.value}
              </span>
            </div>

            {/* Label + Description */}
            <div className={isHorizontal ? '' : 'min-w-0'}>
              <div className="text-sm font-bold text-slate-800 mb-1">{item.label}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{item.description}</div>
            </div>

            {/* Connector arrow between items (not on last) */}
            {content.connector && i < items.length - 1 && isHorizontal && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="text-lg text-slate-400 mt-3"
              >
                {content.connector}
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
