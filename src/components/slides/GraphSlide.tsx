'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { GraphContent } from '@/lib/types';

/* Animated SVG graph with axis labels, gridlines, and draw-on-reveal lines */

const PAD = { top: 40, right: 30, bottom: 50, left: 60 };
const W = 700;
const H = 400;
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

export default function GraphSlide({ content }: { content: GraphContent }) {
  const series = content.series || [];

  /* Compute axis ranges from all data */
  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    for (const s of series) {
      for (const p of s.points) {
        if (p.x < xMin) xMin = p.x;
        if (p.x > xMax) xMax = p.x;
        if (p.y < yMin) yMin = p.y;
        if (p.y > yMax) yMax = p.y;
      }
    }
    if (!isFinite(xMin)) { xMin = 0; xMax = 10; yMin = 0; yMax = 100; }
    const yPad = (yMax - yMin) * 0.1 || 1;
    return { xMin, xMax, yMin: yMin - yPad, yMax: yMax + yPad };
  }, [series]);

  const sx = (x: number) => PAD.left + ((x - xMin) / (xMax - xMin || 1)) * INNER_W;
  const sy = (y: number) => PAD.top + INNER_H - ((y - yMin) / (yMax - yMin || 1)) * INNER_H;

  /* Grid lines */
  const yTicks = 5;
  const xTicks = 6;

  const pathForSeries = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    const sorted = [...pts].sort((a, b) => a.x - b.x);
    return sorted.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
  };

  const areaForSeries = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    const sorted = [...pts].sort((a, b) => a.x - b.x);
    const linePath = sorted.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
    return `${linePath} L${sx(sorted[sorted.length - 1].x).toFixed(1)},${sy(yMin).toFixed(1)} L${sx(sorted[0].x).toFixed(1)},${sy(yMin).toFixed(1)} Z`;
  };

  return (
    <div className="flex flex-col h-full px-6 py-5 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 mb-3">
        <div className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-1">
          {content.chapter} &mdash; {content.heading}
        </div>
      </div>

      {/* Graph */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="flex-1 flex items-center justify-center min-h-0"
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-h-full" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {Array.from({ length: yTicks + 1 }).map((_, i) => {
            const val = yMin + ((yMax - yMin) / yTicks) * i;
            const y = sy(val);
            return (
              <g key={`y-${i}`}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize={11}>
                  {Number.isInteger(val) ? val : val.toFixed(1)}
                </text>
              </g>
            );
          })}
          {Array.from({ length: xTicks + 1 }).map((_, i) => {
            const val = xMin + ((xMax - xMin) / xTicks) * i;
            const x = sx(val);
            return (
              <g key={`x-${i}`}>
                <line x1={x} y1={PAD.top} x2={x} y2={H - PAD.bottom} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
                <text x={x} y={H - PAD.bottom + 18} textAnchor="middle" fill="#94a3b8" fontSize={11}>
                  {Number.isInteger(val) ? val : val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Axes */}
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#cbd5e1" strokeWidth={1.5} />
          <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#cbd5e1" strokeWidth={1.5} />

          {/* Axis labels */}
          <text x={W / 2} y={H - 6} textAnchor="middle" fill="#64748b" fontSize={12} fontWeight={600}>
            {content.xLabel}
          </text>
          <text x={14} y={H / 2} textAnchor="middle" fill="#64748b" fontSize={12} fontWeight={600} transform={`rotate(-90, 14, ${H / 2})`}>
            {content.yLabel}
          </text>

          {/* Area fills */}
          {(content.graphType === 'area') && series.map((s, i) => (
            <motion.path
              key={`area-${i}`}
              d={areaForSeries(s.points)}
              fill={s.color}
              fillOpacity={0.15}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.2, duration: 0.8 }}
            />
          ))}

          {/* Lines */}
          {series.map((s, i) => {
            const d = pathForSeries(s.points);
            const pathLen = s.points.length * 200;
            return (
              <motion.path
                key={`line-${i}`}
                d={d}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.2, duration: 1.5, ease: 'easeInOut' }}
                style={{ pathLength: 0 }}
                strokeDasharray={pathLen}
                strokeDashoffset={pathLen}
              />
            );
          })}

          {/* Scatter dots */}
          {(content.graphType === 'scatter' || content.graphType === 'line' || content.graphType === 'multi-line') && series.map((s, si) =>
            s.points.map((p, pi) => (
              <motion.circle
                key={`dot-${si}-${pi}`}
                cx={sx(p.x)}
                cy={sy(p.y)}
                r={content.graphType === 'scatter' ? 5 : 3}
                fill={s.color}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 + si * 0.15 + pi * 0.05, duration: 0.3 }}
              />
            ))
          )}

          {/* Annotations */}
          {(content.annotations || []).map((a, i) => (
            <g key={`ann-${i}`}>
              <motion.circle
                cx={sx(a.x)} cy={sy(a.y)} r={6}
                fill={a.color} fillOpacity={0.2} stroke={a.color} strokeWidth={1.5}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 1.5 + i * 0.15 }}
              />
              <motion.text
                x={sx(a.x)} y={sy(a.y) - 12}
                textAnchor="middle" fill={a.color} fontSize={11} fontWeight={600}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 1.6 + i * 0.15 }}
              >
                {a.text}
              </motion.text>
            </g>
          ))}
        </svg>
      </motion.div>

      {/* Legend */}
      {series.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="shrink-0 flex items-center justify-center gap-5 mt-2"
        >
          {series.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
              <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
              {s.label}
            </div>
          ))}
        </motion.div>
      )}

      {/* Source */}
      {content.source && (
        <div className="shrink-0 text-[10px] text-slate-400 text-right mt-1">{content.source}</div>
      )}
    </div>
  );
}
