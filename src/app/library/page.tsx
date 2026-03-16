'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  ArrowLeft,
  Play,
  Clock,
  BookOpen,
  Sparkles,
  Loader2,
  FolderOpen,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import { listPresentations, type SavedPresentation } from '@/lib/firestore';
import { usePresentationStore } from '@/stores/presentation-store';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

function formatDate(ts: unknown): string {
  if (!ts) return '';
  // Firestore Timestamp has .seconds
  const obj = ts as { seconds?: number; toDate?: () => Date };
  if (obj.seconds) {
    return new Date(obj.seconds * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return '';
}

export default function LibraryPage() {
  const router = useRouter();
  const store = usePresentationStore();
  const [presentations, setPresentations] = useState<SavedPresentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPresentations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listPresentations(100);
      setPresentations(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load presentations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPresentations();
  }, [loadPresentations]);

  const handlePlay = (saved: SavedPresentation) => {
    const legacyTtsProvider = saved.cost?.costs.find((c) => c.phase === 'tts')?.provider;
    const scriptProvider =
      saved.config.scriptProvider === 'gemini' ||
      saved.config.scriptProvider === 'anthropic' ||
      saved.config.scriptProvider === 'openai'
        ? saved.config.scriptProvider
        : 'gemini';
    const designProvider =
      saved.config.designProvider === 'anthropic' ||
      saved.config.designProvider === 'anthropic-haiku' ||
      saved.config.designProvider === 'openai'
        ? saved.config.designProvider
        : 'anthropic';
    const ttsProvider =
      saved.config.ttsProvider === 'openai' || saved.config.ttsProvider === 'elevenlabs'
        ? saved.config.ttsProvider
        : (legacyTtsProvider === 'openai' || legacyTtsProvider === 'elevenlabs' ? legacyTtsProvider : 'browser');

    store.setConfig({
      topic: saved.config.topic,
      subject: saved.config.subject,
      depth: saved.config.depth,
      duration: saved.config.duration,
      language: saved.config.language,
      scriptProvider,
      designProvider,
      ttsProvider,
    });
    store.setPresentation(saved.presentation);
    if (saved.cost) {
      store.setGenerationCost({
        totalCost: saved.cost.totalCost,
        costs: saved.cost.costs.map(c => ({ ...c, inputCost: 0, outputCost: 0 })),
      });
    }
    router.push('/player');
  };

  return (
    <div className="relative min-h-screen">
      <div className="mesh-bg" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b border-white/[0.04]">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layers className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">EduSlides</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/create')}
            className="btn btn-primary text-sm"
          >
            <Sparkles className="w-4 h-4" />
            New Presentation
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        {/* Header */}
        <div className="pt-8 mb-10 flex items-end justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/[0.07] border border-violet-500/20 text-violet-300 text-xs font-medium mb-5">
              <BookOpen className="w-3 h-3" />
              Community Library
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Presentations</h1>
            <p className="text-lg text-slate-400">
              Browse all AI-generated presentations. Click any to play instantly.
            </p>
          </div>
          <button
            onClick={loadPresentations}
            disabled={loading}
            className="btn btn-secondary text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 text-slate-400"
            >
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-400" />
              <p className="text-sm">Loading presentations...</p>
            </motion.div>
          )}

          {!loading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass p-8 text-center"
            >
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <button onClick={loadPresentations} className="btn btn-secondary text-sm">
                Try again
              </button>
            </motion.div>
          )}

          {!loading && !error && presentations.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 text-slate-400"
            >
              <FolderOpen className="w-12 h-12 mb-4 text-slate-600" />
              <p className="text-lg font-medium text-slate-300 mb-2">No presentations yet</p>
              <p className="text-sm text-slate-500 mb-6">Generated presentations will appear here automatically.</p>
              <button
                onClick={() => router.push('/create')}
                className="btn btn-primary text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Create First Presentation
              </button>
            </motion.div>
          )}

          {!loading && !error && presentations.length > 0 && (
            <motion.div
              key="grid"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {presentations.map((saved, i) => {
                const { presentation, config, cost, createdAt } = saved;
                const slideCount = presentation.slides?.length ?? 0;
                const duration = presentation.metadata?.estimatedDuration ?? config.duration;

                return (
                  <motion.div
                    key={saved.id}
                    custom={i}
                    variants={fadeUp}
                  >
                    <button
                      onClick={() => handlePlay(saved)}
                      className="card group !p-0 overflow-hidden w-full text-left hover:!border-indigo-500/30 cursor-pointer"
                    >
                      {/* Preview header */}
                      <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-[#0c1029] to-[#0f1535]">
                        <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-4 h-4 text-white ml-0.5" />
                        </div>
                        <h3 className="text-base font-semibold text-white mb-1 pr-8 line-clamp-2 group-hover:text-indigo-200 transition-colors">
                          {presentation.metadata?.title || config.topic || 'Untitled'}
                        </h3>
                        {presentation.metadata?.subtitle && (
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {presentation.metadata.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Meta row */}
                      <div className="px-6 py-4 border-t border-white/[0.04]">
                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-3 h-3" />
                            {slideCount} slides
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            ~{duration} min
                          </span>
                          {cost && (
                            <span className="flex items-center gap-1.5">
                              <DollarSign className="w-3 h-3" />
                              ${cost.totalCost.toFixed(3)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-[10px] text-indigo-300 border border-indigo-500/20">
                              {config.language}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-[10px] text-slate-500 border border-white/[0.06]">
                              {config.depth?.split(' ')[0]}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-600">
                            {formatDate(createdAt)}
                          </span>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
