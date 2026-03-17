'use client';

import { motion } from 'framer-motion';
import SlideIcon from '../SlideIcon';
import type { CycleContent } from '@/lib/types';

export default function CycleSlide({ content }: { content: CycleContent }) {
  const nodes = content.nodes || [];
  const count = nodes.length;

  const getPos = (i: number): { x: number; y: number } => {
    if (count === 2) return { x: i === 0 ? 30 : 70, y: 50 };
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const radius = 35;
    return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius };
  };

  return (
    <div className="flex flex-col items-center justify-center h-full slide-pad overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-6 shrink-0">
        <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">
          {content.chapter}
        </span>
        <h2 className="text-2xl font-bold text-slate-800 mt-1">{content.heading}</h2>
      </motion.div>

      <div className="relative w-full max-w-2xl aspect-square flex-1 max-h-[65vh] min-h-0">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" fill="none">
          {nodes.map((_, i) => {
            const from = getPos(i);
            const to = getPos((i + 1) % count);
            return (
              <motion.line
                key={`line-${i}`}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke="rgba(0,0,0,0.08)"
                strokeWidth="0.3"
                strokeDasharray="1 1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.15 }}
              />
            );
          })}
        </svg>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10"
        >
          <div className="text-lg font-black text-slate-800 tracking-wide">{content.centerLabel}</div>
          <div className="text-xs text-slate-400 mt-0.5">{content.centerSub}</div>
        </motion.div>

        {nodes.map((node, i) => {
          const pos = getPos(i);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.18, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-[180px]"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div
                className="rounded-2xl p-4 border text-center bg-white/70 shadow-sm backdrop-blur-sm"
                style={{ borderColor: `${node.color}30` }}
              >
                <div className="flex justify-center mb-1">
                  <SlideIcon name={node.icon} size={24} color={node.color} />
                </div>
                <div className="text-xs font-mono mb-1" style={{ color: node.color }}>
                  {node.value}
                </div>
                <div className="text-sm font-bold text-slate-800 mb-1">{node.label}</div>
                <div className="text-[10px] text-slate-500 leading-relaxed">
                  {node.description}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
