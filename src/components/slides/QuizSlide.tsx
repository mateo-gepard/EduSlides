'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuizContent } from '@/lib/types';
import { usePresentationStore } from '@/stores/presentation-store';

const CORRECT_PHRASES = [
  "That's correct! Nice work.",
  "Exactly right! Well done.",
  "Correct! You nailed it.",
  "Spot on! Great thinking.",
];
const WRONG_PHRASES = [
  "Not quite, but good thought!",
  "Close, but not this time. Keep going!",
  "Wrong answer, but great effort!",
  "That's not it, but you're learning!",
];

export default function QuizSlide({ content }: { content: QuizContent }) {
  const questions = content.questions || [];
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const { config, volume } = usePresentationStore();

  const q = questions[current];

  const speakFeedback = useCallback((correct: boolean) => {
    const phrases = correct ? CORRECT_PHRASES : WRONG_PHRASES;
    const text = phrases[Math.floor(Math.random() * phrases.length)];

    if (config.ttsProvider === 'browser') {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 1.0;
      utt.volume = volume;
      window.speechSynthesis.speak(utt);
      return;
    }

    // Use the user's chosen TTS provider (OpenAI / ElevenLabs)
    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, provider: config.ttsProvider }),
    })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.volume = volume;
        audio.onended = () => URL.revokeObjectURL(url);
        audio.play().catch(() => {});
      })
      .catch(() => {});
  }, [config.ttsProvider, volume]);

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = idx === q.correctIndex;
    if (correct) setScore((s) => s + 1);
    speakFeedback(correct);
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
    <div className="flex flex-col h-full slide-pad overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 shrink-0">
        <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">{content.chapter}</span>
        <h2 className="text-2xl font-bold text-slate-800 mt-1">{content.heading}</h2>
      </motion.div>

      <AnimatePresence mode="wait">
        {!showResult ? (
          <motion.div
            key={`q-${current}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex-1 flex flex-col min-h-0 overflow-y-auto"
          >
            {/* Progress */}
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${((current + 1) / questions.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {current + 1}/{questions.length}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-slate-800 mb-6 shrink-0">{q.question}</h3>

            <div className="space-y-3 flex-1">
              {q.options.map((opt, i) => {
                const isCorrect = i === q.correctIndex;
                const isSelected = selected === i;
                const revealed = selected !== null;

                let borderColor = '#e2e8f0';
                let bg = 'white';
                if (revealed && isCorrect) {
                  borderColor = 'rgba(52,211,153,0.5)';
                  bg = 'rgba(52,211,153,0.06)';
                } else if (revealed && isSelected && !isCorrect) {
                  borderColor = 'rgba(248,113,113,0.5)';
                  bg = 'rgba(248,113,113,0.06)';
                }

                return (
                  <motion.button
                    key={i}
                    onClick={() => handleSelect(i)}
                    whileHover={!revealed ? { scale: 1.01 } : undefined}
                    whileTap={!revealed ? { scale: 0.99 } : undefined}
                    className="w-full text-left px-5 py-3.5 rounded-xl border transition-all text-sm flex items-center gap-3 shadow-sm"
                    style={{ borderColor, background: bg }}
                  >
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold bg-slate-100 text-slate-500 shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-slate-700">{opt}</span>
                    {revealed && isCorrect && (
                      <svg className="w-5 h-5 text-emerald-500 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

            <AnimatePresence>
              {selected !== null && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 shrink-0"
                >
                  <div className="rounded-xl p-4 bg-slate-50 border border-slate-200 text-sm text-slate-600">
                    {q.explanation}
                  </div>
                  <button
                    onClick={handleNext}
                    className="mt-3 px-5 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors shadow-sm"
                  >
                    {current < questions.length - 1 ? 'Next Question' : 'See Results'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <div className="text-6xl font-black text-indigo-500 mb-3">
              {score}/{questions.length}
            </div>
            <p className="text-lg text-slate-800 font-semibold mb-2">
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
              className="mt-6 px-5 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
