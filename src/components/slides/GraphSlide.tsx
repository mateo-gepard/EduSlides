'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { GraphContent } from '@/lib/types';

/* ── Mathematical function plotter & data visualiser ── */

const PAD = { top: 40, right: 30, bottom: 50, left: 60 };
const W = 700;
const H = 400;
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;
const SAMPLES = 200; // resolution of plotted curves

/**
 * Safely evaluate a math expression string for a given x.
 * Supports: x, +, -, *, /, ^, sqrt(), abs(), sin(), cos(), tan(),
 * log(), ln(), exp(), pi, e, parentheses.
 */
function evalExpr(expr: string, x: number): number {
  try {
    // Normalise expression
    let e = expr
      .replace(/\s+/g, '')
      .replace(/\^/g, '**')
      .replace(/(?<!\w)pi(?!\w)/gi, `(${Math.PI})`)
      .replace(/(?<!\w)e(?!\w)/gi, `(${Math.E})`)
      .replace(/sqrt\(/gi, 'Math.sqrt(')
      .replace(/abs\(/gi, 'Math.abs(')
      .replace(/sin\(/gi, 'Math.sin(')
      .replace(/cos\(/gi, 'Math.cos(')
      .replace(/tan\(/gi, 'Math.tan(')
      .replace(/(?<!\.)log\(/gi, 'Math.log10(')
      .replace(/ln\(/gi, 'Math.log(')
      .replace(/exp\(/gi, 'Math.exp(');

    // Insert multiplication: 2x → 2*x, x( → x*(, )( → )*(, )x → )*x
    e = e.replace(/(\d)(x)/gi, '$1*$2');
    e = e.replace(/(x)(\()/gi, '$1*$2');
    e = e.replace(/(\))(\()/g, '$1*$2');
    e = e.replace(/(\))(x)/gi, '$1*$2');
    e = e.replace(/(\d)(Math\.)/g, '$1*$2');
    e = e.replace(/(x)(Math\.)/gi, '$1*$2');

    // Replace variable
    e = e.replace(/x/gi, `(${x})`);

    // Validate: only allow safe characters
    if (/[^0-9+\-*/().eE,Math sqrtabsincogtlp]/.test(e.replace(/Math\.\w+/g, ''))) {
      return NaN;
    }

    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${e})`)();
    return typeof result === 'number' && isFinite(result) ? result : NaN;
  } catch {
    return NaN;
  }
}

export default function GraphSlide({ content }: { content: GraphContent }) {
  const functions = content.functions || [];
  const dataPoints = content.dataPoints || [];

  // Also support legacy "series" field (backward compat)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = content as any;
  const legacySeries: typeof dataPoints = raw.series
    ? (raw.series as { label: string; color: string; points: { x: number; y: number }[] }[]).map(s => ({
        label: s.label,
        color: s.color,
        points: s.points,
        showLine: true,
      }))
    : [];

  const allData = [...dataPoints, ...legacySeries];

  /* ── Sample function curves ── */
  const sampledCurves = useMemo(() => {
    if (functions.length === 0) return [];
    const [xLo, xHi] = content.xRange || [-10, 10];
    const step = (xHi - xLo) / SAMPLES;
    return functions.map((fn) => {
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= SAMPLES; i++) {
        const x = xLo + step * i;
        const y = evalExpr(fn.expression, x);
        if (!isNaN(y)) pts.push({ x, y });
      }
      return { ...fn, points: pts };
    });
  }, [functions, content.xRange]);

  /* ── Compute visual axis ranges ── */
  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    if (content.xRange && content.yRange) {
      return { xMin: content.xRange[0], xMax: content.xRange[1], yMin: content.yRange[0], yMax: content.yRange[1] };
    }
    let xLo = Infinity, xHi = -Infinity, yLo = Infinity, yHi = -Infinity;
    for (const c of sampledCurves) {
      for (const p of c.points) {
        if (p.x < xLo) xLo = p.x;
        if (p.x > xHi) xHi = p.x;
        if (p.y < yLo) yLo = p.y;
        if (p.y > yHi) yHi = p.y;
      }
    }
    for (const d of allData) {
      for (const p of d.points) {
        if (p.x < xLo) xLo = p.x;
        if (p.x > xHi) xHi = p.x;
        if (p.y < yLo) yLo = p.y;
        if (p.y > yHi) yHi = p.y;
      }
    }
    if (!isFinite(xLo)) { xLo = -10; xHi = 10; yLo = -10; yHi = 10; }
    const yPad = (yHi - yLo) * 0.1 || 1;
    return {
      xMin: content.xRange?.[0] ?? xLo,
      xMax: content.xRange?.[1] ?? xHi,
      yMin: content.yRange?.[0] ?? (yLo - yPad),
      yMax: content.yRange?.[1] ?? (yHi + yPad),
    };
  }, [sampledCurves, allData, content.xRange, content.yRange]);

  const sx = (x: number) => PAD.left + ((x - xMin) / (xMax - xMin || 1)) * INNER_W;
  const sy = (y: number) => PAD.top + INNER_H - ((y - yMin) / (yMax - yMin || 1)) * INNER_H;

  const yTicks = 6;
  const xTicks = 6;

  /* Build SVG path from points, splitting at NaN gaps */
  const buildPath = (pts: { x: number; y: number }[]) => {
    let d = '';
    let drawing = false;
    for (const p of pts) {
      const px = sx(p.x);
      const py = sy(p.y);
      if (py < PAD.top - 20 || py > H - PAD.bottom + 20) {
        drawing = false;
        continue;
      }
      d += drawing ? ` L${px.toFixed(1)},${py.toFixed(1)}` : ` M${px.toFixed(1)},${py.toFixed(1)}`;
      drawing = true;
    }
    return d;
  };

  /* Nice tick formatting */
  const fmtTick = (v: number) => {
    if (v === 0) return '0';
    if (Math.abs(v) >= 1000) return v.toFixed(0);
    if (Number.isInteger(v)) return String(v);
    return v.toFixed(1);
  };

  const allLegendItems = [
    ...functions.map((f) => ({ label: f.label, color: f.color, dashed: f.dashed })),
    ...allData.map((d) => ({ label: d.label, color: d.color, dashed: false })),
  ];

  /* ── Whether origin (0) lies within view ── */
  const showXAxis0 = yMin < 0 && yMax > 0;
  const showYAxis0 = xMin < 0 && xMax > 0;

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
          {(content.gridLines !== false) && Array.from({ length: yTicks + 1 }).map((_, i) => {
            const val = yMin + ((yMax - yMin) / yTicks) * i;
            const y = sy(val);
            return (
              <g key={`y-${i}`}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize={11}>{fmtTick(val)}</text>
              </g>
            );
          })}
          {(content.gridLines !== false) && Array.from({ length: xTicks + 1 }).map((_, i) => {
            const val = xMin + ((xMax - xMin) / xTicks) * i;
            const x = sx(val);
            return (
              <g key={`x-${i}`}>
                <line x1={x} y1={PAD.top} x2={x} y2={H - PAD.bottom} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
                <text x={x} y={H - PAD.bottom + 18} textAnchor="middle" fill="#94a3b8" fontSize={11}>{fmtTick(val)}</text>
              </g>
            );
          })}

          {/* Axes border */}
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#cbd5e1" strokeWidth={1.5} />
          <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#cbd5e1" strokeWidth={1.5} />

          {/* Origin axes (x=0 / y=0 lines if in range) */}
          {showXAxis0 && (
            <line x1={PAD.left} y1={sy(0)} x2={W - PAD.right} y2={sy(0)} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" />
          )}
          {showYAxis0 && (
            <line x1={sx(0)} y1={PAD.top} x2={sx(0)} y2={H - PAD.bottom} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" />
          )}

          {/* Axis labels */}
          <text x={W / 2} y={H - 6} textAnchor="middle" fill="#64748b" fontSize={12} fontWeight={600}>{content.xLabel}</text>
          <text x={14} y={H / 2} textAnchor="middle" fill="#64748b" fontSize={12} fontWeight={600} transform={`rotate(-90, 14, ${H / 2})`}>{content.yLabel}</text>

          {/* ── Function curves ── */}
          {sampledCurves.map((fn, i) => (
            <motion.path
              key={`fn-${i}`}
              d={buildPath(fn.points)}
              fill="none"
              stroke={fn.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={fn.dashed ? '8 4' : undefined}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.2, duration: 1.8, ease: 'easeInOut' }}
            />
          ))}

          {/* ── Data point lines ── */}
          {allData.map((ds, i) => {
            if (!ds.showLine && ds.showLine !== undefined) return null;
            const sorted = [...ds.points].sort((a, b) => a.x - b.x);
            return (
              <motion.path
                key={`data-line-${i}`}
                d={buildPath(sorted)}
                fill="none"
                stroke={ds.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.5 + (functions.length + i) * 0.2, duration: 1.2 }}
              />
            );
          })}

          {/* ── Data scatter dots ── */}
          {allData.map((ds, si) =>
            ds.points.map((p, pi) => (
              <motion.circle
                key={`dot-${si}-${pi}`}
                cx={sx(p.x)}
                cy={sy(p.y)}
                r={4}
                fill={ds.color}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 + si * 0.15 + pi * 0.04, duration: 0.3 }}
              />
            ))
          )}

          {/* ── Annotations ── */}
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
      {allLegendItems.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="shrink-0 flex items-center justify-center gap-5 mt-2 flex-wrap"
        >
          {allLegendItems.map((it, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
              <span
                className="w-4 h-0.5 rounded"
                style={{
                  background: it.color,
                  borderTop: it.dashed ? `2px dashed ${it.color}` : undefined,
                  height: it.dashed ? 0 : 2,
                }}
              />
              {it.label}
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
