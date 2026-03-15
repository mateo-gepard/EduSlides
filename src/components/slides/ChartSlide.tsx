'use client';

import { motion } from 'framer-motion';
import type { ChartContent } from '@/lib/types';

function BarChart({ content }: { content: ChartContent }) {
  const bars = content.bars || [];
  return (
    <div className="flex items-end gap-3 h-full px-6 pb-4 pt-10">
      {bars.map((bar, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 + i * 0.1 }}
            className="text-xs font-mono font-semibold text-slate-700"
          >
            {bar.displayValue}
          </motion.span>
          <motion.div
            className="w-full rounded-t-lg min-w-[24px]"
            style={{ background: `linear-gradient(to top, ${bar.color}60, ${bar.color})` }}
            initial={{ height: 0 }}
            animate={{ height: `${bar.percent}%` }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
          <span className="text-[10px] text-slate-500 text-center leading-tight mt-1 max-w-[80px] truncate">
            {bar.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function PieChart({ content }: { content: ChartContent }) {
  const segments = content.segments || [];
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const radius = 80;
  const cx = 120, cy = 120;
  let cumulative = 0;

  const paths = segments.map((seg, i) => {
    const startAngle = (cumulative / total) * Math.PI * 2 - Math.PI / 2;
    cumulative += seg.value;
    const endAngle = (cumulative / total) * Math.PI * 2 - Math.PI / 2;
    const largeArc = seg.value / total > 0.5 ? 1 : 0;
    const x1 = cx + Math.cos(startAngle) * radius;
    const y1 = cy + Math.sin(startAngle) * radius;
    const x2 = cx + Math.cos(endAngle) * radius;
    const y2 = cy + Math.sin(endAngle) * radius;
    const innerR = 50;
    const ix1 = cx + Math.cos(endAngle) * innerR;
    const iy1 = cy + Math.sin(endAngle) * innerR;
    const ix2 = cx + Math.cos(startAngle) * innerR;
    const iy2 = cy + Math.sin(startAngle) * innerR;
    const d = `M${x1},${y1} A${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} L${ix1},${iy1} A${innerR},${innerR} 0 ${largeArc} 0 ${ix2},${iy2} Z`;
    return { d, color: seg.color, label: seg.label, value: seg.value, i };
  });

  return (
    <div className="flex items-center justify-center gap-8 h-full">
      <svg viewBox="0 0 240 240" className="w-60 h-60">
        {paths.map((p) => (
          <motion.path
            key={p.i}
            d={p.d}
            fill={p.color}
            fillOpacity={0.85}
            stroke="white"
            strokeWidth="2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + p.i * 0.12, duration: 0.5 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}
        {content.centerLabel && (
          <text x={cx} y={cy + 5} textAnchor="middle" fill="#334155" fontSize="12" fontWeight="700">
            {content.centerLabel}
          </text>
        )}
      </svg>

      <div className="space-y-2">
        {segments.map((seg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.08 }}
            className="flex items-center gap-2.5 text-sm"
          >
            <div className="w-3 h-3 rounded-sm" style={{ background: seg.color }} />
            <span className="text-slate-600">{seg.label}</span>
            <span className="text-slate-400 font-mono text-xs ml-auto">
              {total > 0 ? Math.round((seg.value / total) * 100) : 0}%
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function ChartSlide({ content }: { content: ChartContent }) {
  return (
    <div className="flex flex-col h-full px-10 py-10 overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 shrink-0">
        <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">{content.chapter}</span>
        <h2 className="text-2xl font-bold text-slate-800 mt-1">{content.heading}</h2>
        {content.source && <p className="text-[10px] text-slate-400 mt-1 italic">{content.source}</p>}
      </motion.div>

      <div className="flex-1 min-h-0">
        {content.chartType === 'pie' ? (
          <PieChart content={content} />
        ) : (
          <BarChart content={content} />
        )}
      </div>
    </div>
  );
}
