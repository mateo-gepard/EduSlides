'use client';

import { motion } from 'framer-motion';
import type { CodeContent } from '@/lib/types';

export default function CodeSlide({ content }: { content: CodeContent }) {
  const lines = content.code.split('\n');
  const highlights = new Set(content.highlights || []);

  return (
    <div className="flex flex-col h-full px-6 py-5 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 mb-3">
        <div className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-1">
          {content.chapter} &mdash; {content.heading}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-5 overflow-hidden">
        {/* Code block */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex-1 min-w-0 bg-slate-900 rounded-xl overflow-hidden shadow-lg flex flex-col"
        >
          {/* Title bar */}
          <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-slate-800 border-b border-slate-700">
            <span className="w-3 h-3 rounded-full bg-red-400/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
            <span className="w-3 h-3 rounded-full bg-green-400/80" />
            <span className="text-xs text-slate-400 ml-2 font-mono">{content.language}</span>
          </div>

          {/* Code lines */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <pre className="text-sm leading-6 font-mono">
              {lines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.04, duration: 0.3 }}
                  className={`flex ${highlights.has(i + 1) ? 'bg-yellow-500/10 -mx-2 px-2 rounded' : ''}`}
                >
                  <span className="w-8 shrink-0 text-right text-slate-600 select-none mr-4 text-xs leading-6">
                    {i + 1}
                  </span>
                  <span className={highlights.has(i + 1) ? 'text-yellow-200' : 'text-slate-200'}>
                    {line || ' '}
                  </span>
                </motion.div>
              ))}
            </pre>
          </div>
        </motion.div>

        {/* Explanation sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="w-[35%] shrink-0 flex flex-col gap-4 overflow-y-auto min-h-0"
        >
          {/* Explanation */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Explanation</h4>
            <p className="text-sm text-slate-700 leading-relaxed">{content.explanation}</p>
          </div>

          {/* Output */}
          {content.output && (
            <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Output</h4>
              <pre className="text-sm text-slate-700 font-mono whitespace-pre-wrap bg-slate-50 rounded-lg p-3">
                {content.output}
              </pre>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
