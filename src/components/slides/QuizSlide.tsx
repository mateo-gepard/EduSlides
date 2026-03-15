'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuizContent } from '@/lib/types';

export default function QuizSlide({ content }: { content: QuizContent }) {
  const questions = content.questions || [];
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const q = questions[current];

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === q.correctIndex) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
    } else {
      setShowResult(true);
    }
  };

  if (!q) return null;

  return (
    <div className="flex flex-col h-full px-10 py-10">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
        <span className="text-xs font-medium tracking-widest uppercase text-slate-500">{content.chapter}</span>
        <h2 className="text-2xl font-bold text-white mt-1">{content.heading}</h2>
      </motion.div>

      <AnimatePresence mode="wait">
        {!showResult ? (
          <motion.div
            key={`q-${current}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex-1 flex flex-col"
          >
            {/* Progress */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-1 rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${((current + 1) / questions.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {current + 1}/{questions.length}
              </span>
            </div>

            {/* Question */}
            <h3 className="text-lg font-semibold text-white mb-6">{q.question}</h3>

            {/* Options */}
            <div className="space-y-3 flex-1">
              {q.options.map((opt, i) => {
                const isCorrect = i === q.correctIndex;
                const isSelected = selected === i;
                const revealed = selected !== null;

                let borderColor = 'rgba(255,255,255,0.06)';
                let bg = 'transparent';
                if (revealed && isCorrect) {
                  borderColor = 'rgba(52,211,153,0.4)';
                  bg = 'rgba(52,211,153,0.06)';
                } else if (revealed && isSelected && !isCorrect) {
                  borderColor = 'rgba(248,113,113,0.4)';
                  bg = 'rgba(248,113,113,0.06)';
                }

                return (
                  <motion.button
                    key={i}
                    onClick={() => handleSelect(i)}
                    whileHover={!revealed ? { scale: 1.01 } : undefined}
                    whileTap={!revealed ? { scale: 0.99 } : undefined}
                    className="w-full text-left px-5 py-3.5 rounded-xl border transition-all text-sm flex items-center gap-3"
                    style={{ borderColor, background: bg }}
                  >
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold bg-white/[0.04] text-slate-400 shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-slate-300">{opt}</span>
                    {revealed && isCorrect && (
                      <svg className="w-5 h-5 text-emerald-400 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {revealed && isSelected && !isCorrect && (
                      <svg className="w-5 h-5 text-red-400 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {selected !== null && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4"
                >
                  <div className="rounded-xl p-4 bg-white/[0.03] border border-white/[0.06] text-sm text-slate-400">
                    {q.explanation}
                  </div>
                  <button
                    onClick={handleNext}
                    className="mt-3 px-5 py-2 rounded-lg bg-indigo-500/15 text-indigo-300 text-sm font-medium hover:bg-indigo-500/25 transition-colors"
                  >
                    {current < questions.length - 1 ? 'Next Question' : 'See Results'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* ─── Results ─── */
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <div className="text-6xl font-black text-indigo-400 mb-3">
              {score}/{questions.length}
            </div>
            <p className="text-lg text-white font-semibold mb-2">
              {score === questions.length
                ? 'Perfect!'
                : score >= questions.length * 0.7
                  ? 'Great job!'
                  : 'Keep studying!'}
            </p>
            <p className="text-sm text-slate-500">
              You answered {score} out of {questions.length} correctly.
            </p>
            <button
              onClick={() => { setCurrent(0); setSelected(null); setScore(0); setShowResult(false); }}
              className="mt-6 px-5 py-2 rounded-lg bg-white/[0.06] border border-white/[0.06] text-sm text-slate-300 hover:bg-white/[0.1] transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
