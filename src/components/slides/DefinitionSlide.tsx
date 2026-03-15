'use client';

import { motion } from 'framer-motion';
import type { DefinitionContent } from '@/lib/types';

export default function DefinitionSlide({ content }: { content: DefinitionContent }) {
  const terms = content.terms || [];

  return (
    <div className="flex flex-col h-full px-6 py-5 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 mb-4">
        <div className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-1">
          {content.chapter} &mdash; {content.heading}
        </div>
      </div>

      {/* Terms */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-5 overflow-y-auto px-2">
        {terms.map((term, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-3xl bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm p-6"
          >
            {/* Term header */}
            <div className="flex items-baseline gap-3 mb-3">
              <h3 className="text-2xl font-black text-slate-800">{term.term}</h3>
              {term.pronunciation && (
                <span className="text-sm text-slate-400 italic">/{term.pronunciation}/</span>
              )}
              {term.partOfSpeech && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${term.color}18`, color: term.color }}
                >
                  {term.partOfSpeech}
                </span>
              )}
            </div>

            {/* Left accent bar */}
            <div className="flex gap-4">
              <div className="w-1 shrink-0 rounded-full" style={{ background: term.color }} />
              <div className="min-w-0">
                {/* Definition */}
                <p className="text-base text-slate-700 leading-relaxed mb-2">{term.definition}</p>

                {/* Example */}
                {term.example && (
                  <div className="bg-slate-50 rounded-lg px-4 py-2 mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Example</span>
                    <p className="text-sm text-slate-600 italic mt-0.5">{term.example}</p>
                  </div>
                )}

                {/* Related terms */}
                {term.relatedTerms && term.relatedTerms.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs text-slate-400 mr-1">Related:</span>
                    {term.relatedTerms.map((rt, j) => (
                      <span
                        key={j}
                        className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                      >
                        {rt}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
