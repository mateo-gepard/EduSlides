'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircleQuestion, Send, X, Loader2 } from 'lucide-react';
import type { Slide } from '@/lib/types';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface SlideQAProps {
  slide: Slide;
  presentationTitle: string;
  language: string;
}

export default function SlideQA({ slide, presentationTitle, language }: SlideQAProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear chat when slide changes
  useEffect(() => {
    setMessages([]);
  }, [slide.id]);

  // Auto-scroll & focus
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const ask = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    try {
      const slideContent = JSON.stringify(slide.content);
      const slideNarration = (slide.narration || []).map((n) => n.text).join(' ');

      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          slideContent,
          slideNarration,
          presentationTitle,
          language,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.answer || data.error || 'No response.' },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Could not reach the AI. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, slide, presentationTitle, language]);

  return (
    <>
      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-[88px] right-3 sm:right-4 z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 text-white/60 hover:text-white shadow-lg flex items-center justify-center transition-colors"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        title="Ask a question about this slide"
      >
        {open ? <X className="w-4 h-4" /> : <MessageCircleQuestion className="w-4 h-4" />}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-[120px] sm:bottom-[136px] right-2 sm:right-4 z-40 w-[calc(100vw-16px)] sm:w-80 max-h-[50vh] sm:max-h-[380px] rounded-xl bg-[#0f1629]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                <MessageCircleQuestion className="w-4 h-4 text-indigo-400" />
                Ask Gemini
              </h3>
              <p className="text-[11px] text-white/40 mt-0.5">Questions about the current slide</p>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[120px] max-h-[240px]">
              {messages.length === 0 && (
                <p className="text-xs text-white/30 text-center mt-6">
                  Ask anything about this slide...
                </p>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-sm leading-relaxed ${
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <span
                    className={`inline-block px-3 py-2 rounded-xl max-w-[90%] ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/[0.06] text-white/80'
                    }`}
                  >
                    {msg.text}
                  </span>
                </div>
              ))}
              {loading && (
                <div className="text-left">
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] text-white/50 text-sm">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Thinking...
                  </span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-3 py-2.5 border-t border-white/[0.06] flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ask()}
                placeholder="Type your question..."
                className="flex-1 text-sm px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/30 text-white/80 placeholder-white/30"
              />
              <button
                onClick={ask}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/[0.06] disabled:text-white/20 text-white flex items-center justify-center transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
