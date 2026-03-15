'use client';

import { motion } from 'framer-motion';
import type { DataTableContent } from '@/lib/types';

const badgeColors: Record<string, { bg: string; text: string; border: string }> = {
  low:      { bg: 'rgba(52,211,153,0.1)', text: '#34d399', border: 'rgba(52,211,153,0.2)' },
  med:      { bg: 'rgba(251,191,36,0.1)',  text: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
  high:     { bg: 'rgba(251,146,60,0.1)',  text: '#fb923c', border: 'rgba(251,146,60,0.2)' },
  critical: { bg: 'rgba(248,113,113,0.1)', text: '#f87171', border: 'rgba(248,113,113,0.2)' },
  max:      { bg: 'rgba(239,68,68,0.15)',  text: '#ef4444', border: 'rgba(239,68,68,0.25)' },
};

export default function DataTableSlide({ content }: { content: DataTableContent }) {
  return (
    <div className="flex h-full px-8 py-8 gap-6">
      {/* Table */}
      <div className="flex-1 flex flex-col min-w-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4"
        >
          <span className="text-xs font-medium tracking-widest uppercase text-slate-500">
            {content.chapter}
          </span>
          <h2 className="text-2xl font-bold text-white mt-1">{content.heading}</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="rounded-xl border border-white/[0.06] overflow-hidden flex-1"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {content.headers.map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 tracking-wide uppercase">
                    {h}
                  </th>
                ))}
                {content.rows.some((r) => r.badge) && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 tracking-wide uppercase">
                    Level
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {content.rows.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  {row.cells.map((c, j) => (
                    <td key={j} className="px-4 py-2.5 text-slate-300">
                      {c}
                    </td>
                  ))}
                  {row.badge && (
                    <td className="px-4 py-2.5">
                      <span
                        className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold border"
                        style={{
                          background: badgeColors[row.badge.level]?.bg,
                          color: badgeColors[row.badge.level]?.text,
                          borderColor: badgeColors[row.badge.level]?.border,
                        }}
                      >
                        {row.badge.text}
                      </span>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>

      {/* Calculator / Example panel */}
      {content.example && (
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="w-72 shrink-0 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.04] p-5 flex flex-col"
        >
          <h3 className="text-sm font-bold text-indigo-300 mb-2">{content.example.title}</h3>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">{content.example.description}</p>

          <div className="space-y-2 mb-4">
            {content.example.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  {item.label}
                </span>
                <span className="font-mono text-white">{item.value}</span>
              </div>
            ))}
          </div>

          {content.example.formula && (
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-xs font-mono text-slate-300 mb-3">
              {content.example.formula}
            </div>
          )}

          <div className="mt-auto rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3 text-center">
            <div className="text-2xl font-black text-indigo-300">{content.example.result.value}</div>
            <div className="text-[10px] text-indigo-400/70 mt-0.5">{content.example.result.label}</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
