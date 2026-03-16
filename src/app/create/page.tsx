'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Layers,
  Upload,
  FileText,
  Settings2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  BrainCircuit,
  Palette,
  Volume2,
  ChevronDown,
  Info,
  X,
} from 'lucide-react';
import { usePresentationStore } from '@/stores/presentation-store';
import { savePresentation } from '@/lib/firestore';
import type { Presentation, GenerationPhase } from '@/lib/types';

type DebugEntry = {
  id: number;
  ts: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  meta?: unknown;
};

/* ─── Constants ─── */
const DEPTHS = [
  'Einführung (basic)',
  'Grundkurs (standard)',
  'Leistungskurs (advanced)',
  'Universität (expert)',
];

const LANGUAGES = [
  'Deutsch',
  'English',
  'Español',
  'Français',
  'Italiano',
  'Português',
  '日本語',
  '中文',
];

const SCRIPT_PROVIDERS = [
  { value: 'gemini', label: 'Gemini 3.1 Pro', desc: 'Deep research & knowledge' },
  { value: 'anthropic', label: 'Claude Sonnet 4', desc: 'Precise & structured' },
  { value: 'openai', label: 'GPT-4o', desc: 'Fast & versatile' },
] as const;

const DESIGN_PROVIDERS = [
  { value: 'anthropic', label: 'Claude Sonnet 4', desc: 'Best JSON compliance' },
  { value: 'anthropic-haiku', label: 'Claude Haiku 4', desc: 'Fast & cheap (~3x less)' },
  { value: 'openai', label: 'GPT-4o', desc: 'Fast alternative' },
] as const;

const TTS_PROVIDERS = [
  { value: 'browser', label: 'Browser TTS', desc: 'Free, instant' },
  { value: 'openai', label: 'OpenAI TTS HD', desc: 'Natural voice' },
  { value: 'elevenlabs', label: 'ElevenLabs', desc: 'Premium quality' },
] as const;

/* ─── Phase display config ─── */
const PHASE_CONFIG: Record<string, { icon: typeof Loader2; label: string; color: string }> = {
  researching: { icon: BrainCircuit, label: 'Researching & Writing Script', color: 'text-blue-400' },
  designing: { icon: Palette, label: 'Designing Visual Slides', color: 'text-violet-400' },
  'generating-audio': { icon: Volume2, label: 'Generating Audio', color: 'text-emerald-400' },
  complete: { icon: CheckCircle2, label: 'Complete', color: 'text-emerald-400' },
  error: { icon: AlertCircle, label: 'Error', color: 'text-red-400' },
};

/* ─── Animation ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function CreatePage() {
  const router = useRouter();
  const store = usePresentationStore();
  const { config, phase, phaseMessage, generationCost } = store;

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showConsole, setShowConsole] = useState(true);
  const [debugLog, setDebugLog] = useState<DebugEntry[]>([]);
  const [pdfText, setPdfText] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isGenerating = phase === 'researching' || phase === 'designing' || phase === 'generating-audio';

  /* ─── PDF Upload ─── */
  const handlePdfUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) return;
    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/parse-pdf', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Failed to parse PDF');
      const data = await res.json();
      setPdfText(data.text || '');
      setPdfName(file.name);
    } catch {
      setPdfText('');
      setPdfName('');
    } finally {
      setUploadingPdf(false);
    }
  }, []);

  /* ─── Generate ─── */
  const handleGenerate = useCallback(async () => {
    if (!config.topic.trim() && !pdfText) return;

    const pushLog = (entry: Omit<DebugEntry, 'id'>) => {
      setDebugLog((prev) => {
        const next = [...prev, { ...entry, id: Date.now() + Math.floor(Math.random() * 1000) }];
        return next.slice(-120);
      });
    };

    store.reset();
    store.setPhase('researching', 'Starting generation...');
    setDebugLog([]);
    pushLog({ ts: new Date().toISOString(), level: 'info', message: 'Generation started', meta: {
      scriptProvider: config.scriptProvider,
      designProvider: config.designProvider,
      ttsProvider: config.ttsProvider,
      duration: config.duration,
      language: config.language,
      hasPdfContext: Boolean(pdfText),
    } });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const effectiveTopic = config.topic.trim() || (pdfName ? pdfName.replace(/\.pdf$/i, '') : '');

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: effectiveTopic,
          subject: config.subject,
          depth: config.depth,
          duration: config.duration,
          language: config.language,
          additionalContext: pdfText || config.additionalContext || undefined,
          scriptProvider: config.scriptProvider,
          designProvider: config.designProvider,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let pendingPresentation: Presentation | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ') && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));
              switch (currentEvent) {
                case 'phase':
                  store.setPhase(data.phase as GenerationPhase, data.message);
                  pushLog({
                    ts: new Date().toISOString(),
                    level: 'info',
                    message: `Phase: ${data.phase}`,
                    meta: data.message ? { message: data.message } : undefined,
                  });
                  break;
                case 'cost':
                  store.setGenerationCost({ costs: data.costs, totalCost: data.totalCost });
                  pushLog({
                    ts: new Date().toISOString(),
                    level: 'info',
                    message: 'Cost update received',
                    meta: { totalCost: data.totalCost, phases: data.costs?.length ?? 0 },
                  });
                  break;
                case 'script':
                  pushLog({
                    ts: new Date().toISOString(),
                    level: 'info',
                    message: 'Script payload received',
                    meta: { chars: typeof data.script === 'string' ? data.script.length : 0 },
                  });
                  break;
                case 'debug':
                  pushLog({
                    ts: typeof data.ts === 'string' ? data.ts : new Date().toISOString(),
                    level: (data.level as 'info' | 'warn' | 'error') || 'info',
                    message: data.message || 'Debug event',
                    meta: data.meta,
                  });
                  break;
                case 'model-output':
                  pushLog({
                    ts: new Date().toISOString(),
                    level: 'info',
                    message: `Live output: ${data.label || 'model'}`,
                    meta: {
                      textLength: data.textLength,
                      delta: data.delta,
                      preview: data.preview,
                    },
                  });
                  break;
                case 'result':
                  pendingPresentation = data.presentation as Presentation;
                  pushLog({
                    ts: new Date().toISOString(),
                    level: 'info',
                    message: 'Presentation result received',
                    meta: { slides: data.presentation?.slides?.length ?? 0 },
                  });
                  break;
                case 'error':
                  throw new Error(data.error);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
            currentEvent = '';
          }
        }
      }

      // Fetch images for slides that have imageQuery (including image-spotlight content)
      if (pendingPresentation) {
        // Also pull imageQuery from image-spotlight content into slide level
        for (const slide of pendingPresentation.slides) {
          if (slide.content?.type === 'image-spotlight' && !slide.imageQuery) {
            const isc = slide.content as { imageQuery?: string };
            if (isc.imageQuery) slide.imageQuery = isc.imageQuery;
          }
        }

        const imgSlides = pendingPresentation.slides.filter((s) => s.imageQuery);
        if (imgSlides.length > 0) {
          store.setPhase('designing', 'Loading reference images...');
          await Promise.allSettled(
            imgSlides.map(async (slide) => {
              try {
                const imgRes = await fetch(
                  `/api/image-search?q=${encodeURIComponent(slide.imageQuery!)}`,
                  { signal: AbortSignal.timeout(8000) }
                );
                const imgData = await imgRes.json();
                if (imgData.imageUrl) slide.imageUrl = imgData.imageUrl;
              } catch {
                /* images are optional */
              }
            })
          );
        }
        store.setPresentation(pendingPresentation);

        // Phase 3: Generate TTS audio (if not browser)
        if (config.ttsProvider !== 'browser') {
          const getAudioDurationSeconds = (url: string) =>
            new Promise<number>((resolve) => {
              const audio = new Audio();
              audio.preload = 'metadata';
              audio.onloadedmetadata = () => resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
              audio.onerror = () => resolve(0);
              audio.src = url;
            });

          const narrationSlides = pendingPresentation.slides.filter(
            (s) => s.narration?.length,
          );
          if (narrationSlides.length > 0) {
            store.setPhase('generating-audio', `Generating audio (0/${narrationSlides.length})...`);
            let done = 0;
            let totalTtsChars = 0;
            // Process 3 at a time to avoid overloading
            for (let i = 0; i < narrationSlides.length; i += 3) {
              const batch = narrationSlides.slice(i, i + 3);
              await Promise.allSettled(
                batch.map(async (slide) => {
                  const text = slide.narration!.map((n) => n.text).join(' ');
                  if (!text.trim()) return;
                  try {
                    const ttsRes = await fetch('/api/tts', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        text,
                        provider: config.ttsProvider,
                      }),
                      signal: controller.signal,
                    });
                    if (ttsRes.ok) {
                      const blob = await ttsRes.blob();
                      const url = URL.createObjectURL(blob);
                      store.setAudio(slide.id, url);
                      totalTtsChars += text.length;

                      // Orient slide duration by generated audio length (with thinking/pause room).
                      const audioDuration = await getAudioDurationSeconds(url);
                      if (audioDuration > 0) {
                        const minFromAudio = Math.ceil(audioDuration + 4); // 2s start + 2s end buffer
                        const orientedDuration = Math.round((audioDuration * 1.08) + 4);
                        slide.duration = Math.max(slide.duration || 0, minFromAudio, orientedDuration);
                      }
                    }
                  } catch {
                    /* TTS for individual slides is best-effort */
                  }
                  done++;
                  store.setPhase('generating-audio', `Generating audio (${done}/${narrationSlides.length})...`);
                }),
              );
            }

            // Add TTS cost to generation cost
            if (totalTtsChars > 0) {
              const TTS_PRICE_PER_1K: Record<string, number> = {
                openai: 0.030,      // tts-1-hd
                elevenlabs: 0.30,  // eleven_multilingual_v2
              };
              const ttsCost = totalTtsChars * ((TTS_PRICE_PER_1K[config.ttsProvider] ?? 0) / 1000);
              const existing = store.generationCost;
              store.setGenerationCost({
                costs: [
                  ...(existing?.costs ?? []),
                  { phase: 'tts', provider: config.ttsProvider, inputCost: ttsCost, outputCost: 0, total: ttsCost, inputTokens: totalTtsChars, outputTokens: 0 },
                ],
                totalCost: (existing?.totalCost ?? 0) + ttsCost,
              });
            }

            // Refresh presentation timing after TTS-adjusted durations.
            const totalSeconds = pendingPresentation.slides.reduce((acc, s) => acc + (s.duration || 0), 0);
            pendingPresentation.metadata.estimatedDuration = Math.max(1, Math.round(totalSeconds / 60));
            store.setPresentation(pendingPresentation);
          }
        }

        store.setPhase('complete', 'Presentation ready!');
        pushLog({ ts: new Date().toISOString(), level: 'info', message: 'Pipeline completed successfully' });

        // Save to Firestore (fire-and-forget)
        const costData = store.generationCost ?? undefined;
        savePresentation(
          pendingPresentation,
          {
            topic: config.topic,
            subject: config.subject,
            depth: config.depth,
            duration: config.duration,
            language: config.language,
            scriptProvider: config.scriptProvider,
            designProvider: config.designProvider,
            ttsProvider: config.ttsProvider,
          },
          costData ? { totalCost: costData.totalCost, costs: costData.costs } : undefined,
        ).catch((e) => { console.warn('[EduSlides] Firestore save failed:', e); });
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        store.setPhase('idle', '');
        pushLog({ ts: new Date().toISOString(), level: 'warn', message: 'Generation cancelled by user' });
      } else {
        store.setError((err as Error).message);
        pushLog({
          ts: new Date().toISOString(),
          level: 'error',
          message: 'Generation failed',
          meta: { error: (err as Error).message },
        });
      }
    }
  }, [config, pdfText, store]);

  const handleCancel = () => {
    abortRef.current?.abort();
    store.setPhase('idle', '');
  };

  const handlePlay = () => {
    router.push('/player');
  };

  return (
    <div className="relative min-h-screen">
      <div className="mesh-bg" />

      {/* ─── Nav ─── */}
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
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={() => router.push('/library')}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Library
        </button>
      </nav>

      {/* ─── Main ─── */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 pb-24">
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
          {/* Header */}
          <motion.div variants={fadeUp} className="mb-10 pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/[0.07] border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-5">
              <Sparkles className="w-3 h-3" />
              AI Generation Pipeline
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Create Presentation</h1>
            <p className="text-lg text-slate-400">Describe a topic or upload a PDF. Two AI models do the rest.</p>
          </motion.div>

          {/* ─── Topic Input ─── */}
          <motion.div variants={fadeUp} className="space-y-4 mb-6">
            <div>
              <label className="label">Topic</label>
              <input
                type="text"
                className="input-base text-lg"
                placeholder="e.g. Polytraumata im Sport, Quantum Computing, Renaissance Art..."
                value={config.topic}
                onChange={(e) => store.setConfig({ topic: e.target.value })}
                disabled={isGenerating}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Subject (optional)</label>
                <input
                  type="text"
                  className="input-base"
                  placeholder="e.g. Medicine, Physics..."
                  value={config.subject}
                  onChange={(e) => store.setConfig({ subject: e.target.value })}
                  disabled={isGenerating}
                />
              </div>
              <div>
                <label className="label">Language</label>
                <div className="relative">
                  <select
                    className="input-base appearance-none pr-10"
                    value={config.language}
                    onChange={(e) => store.setConfig({ language: e.target.value })}
                    disabled={isGenerating}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Depth</label>
                <div className="relative">
                  <select
                    className="input-base appearance-none pr-10"
                    value={config.depth}
                    onChange={(e) => store.setConfig({ depth: e.target.value })}
                    disabled={isGenerating}
                  >
                    {DEPTHS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="label">Duration (minutes)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={2}
                    max={20}
                    step={1}
                    value={config.duration}
                    onChange={(e) => store.setConfig({ duration: Number(e.target.value) })}
                    disabled={isGenerating}
                    className="flex-1 accent-indigo-500"
                  />
                  <span className="text-white font-mono text-sm w-8 text-right tabular-nums">
                    {config.duration}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ─── PDF Upload ─── */}
          <motion.div variants={fadeUp} className="mb-6">
            <div
              className="glass glass-hover p-5 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePdfUpload(file);
                }}
              />
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/15 transition-colors">
                  {uploadingPdf ? (
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  ) : pdfName ? (
                    <FileText className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Upload className="w-5 h-5 text-indigo-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {pdfName ? (
                    <>
                      <p className="text-sm font-medium text-white truncate">{pdfName}</p>
                      <p className="text-xs text-slate-500">{pdfText.length.toLocaleString()} characters extracted</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-slate-300">Upload PDF (optional)</p>
                      <p className="text-xs text-slate-500">Extract content from your notes or textbook</p>
                    </>
                  )}
                </div>
                {pdfName && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPdfText('');
                      setPdfName('');
                    }}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* ─── Advanced Settings ─── */}
          <motion.div variants={fadeUp} className="mb-8">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-4"
            >
              <Settings2 className="w-4 h-4" />
              AI Pipeline Settings
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="glass p-5 space-y-5">
                    <div className="flex items-start gap-2 text-xs text-slate-500 mb-2">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        The script provider researches and writes the content. The design provider compiles it into visual slides.
                        Using two different models yields the best results.
                      </span>
                    </div>

                    {/* Script Provider */}
                    <div>
                      <label className="label flex items-center gap-1.5">
                        <BrainCircuit className="w-3.5 h-3.5" /> Script Writer
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {SCRIPT_PROVIDERS.map((p) => (
                          <button
                            key={p.value}
                            onClick={() => store.setConfig({ scriptProvider: p.value as 'gemini' | 'anthropic' | 'openai' })}
                            disabled={isGenerating}
                            className={`p-3 rounded-xl text-left transition-all border ${
                              config.scriptProvider === p.value
                                ? 'border-indigo-500/50 bg-indigo-500/10'
                                : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                            }`}
                          >
                            <p className={`text-xs font-medium ${config.scriptProvider === p.value ? 'text-indigo-300' : 'text-slate-300'}`}>
                              {p.label}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{p.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Design Provider */}
                    <div>
                      <label className="label flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5" /> Design Compiler
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {DESIGN_PROVIDERS.map((p) => (
                          <button
                            key={p.value}
                            onClick={() => store.setConfig({ designProvider: p.value as 'anthropic' | 'anthropic-haiku' | 'openai' })}
                            disabled={isGenerating}
                            className={`p-3 rounded-xl text-left transition-all border ${
                              config.designProvider === p.value
                                ? 'border-violet-500/50 bg-violet-500/10'
                                : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                            }`}
                          >
                            <p className={`text-[11px] font-medium ${config.designProvider === p.value ? 'text-violet-300' : 'text-slate-300'}`}>
                              {p.label}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{p.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* TTS Provider */}
                    <div>
                      <label className="label flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5" /> Voice Provider
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {TTS_PROVIDERS.map((p) => (
                          <button
                            key={p.value}
                            onClick={() => store.setConfig({ ttsProvider: p.value as 'openai' | 'elevenlabs' | 'browser' })}
                            disabled={isGenerating}
                            className={`p-3 rounded-xl text-left transition-all border ${
                              config.ttsProvider === p.value
                                ? 'border-emerald-500/50 bg-emerald-500/10'
                                : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                            }`}
                          >
                            <p className={`text-xs font-medium ${config.ttsProvider === p.value ? 'text-emerald-300' : 'text-slate-300'}`}>
                              {p.label}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{p.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Additional Context */}
                    <div>
                      <label className="label">Additional Context (optional)</label>
                      <textarea
                        className="input-base min-h-[80px] resize-y"
                        placeholder="Any extra instructions, focus areas, or source material..."
                        value={config.additionalContext}
                        onChange={(e) => store.setConfig({ additionalContext: e.target.value })}
                        disabled={isGenerating}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ─── Generate / Progress ─── */}
          <motion.div variants={fadeUp}>
            <AnimatePresence mode="wait">
              {phase === 'idle' && (
                <motion.button
                  key="generate"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={handleGenerate}
                  disabled={!config.topic.trim() && !pdfText}
                  className="btn btn-primary w-full py-4 text-base"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Presentation
                </motion.button>
              )}

              {isGenerating && (
                <motion.div
                  key="progress"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass p-6 space-y-4"
                >
                  <GenerationProgress phase={phase} message={phaseMessage} onCancel={handleCancel} />
                  <GenerationConsole
                    logs={debugLog}
                    open={showConsole}
                    onToggle={() => setShowConsole((v) => !v)}
                  />
                </motion.div>
              )}

              {phase === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="glass p-5 border-red-500/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-300">Generation Failed</p>
                        <p className="text-xs text-slate-400 mt-1">{phaseMessage}</p>
                      </div>
                    </div>
                  </div>
                  <div className="glass p-4">
                    <GenerationConsole
                      logs={debugLog}
                      open={showConsole}
                      onToggle={() => setShowConsole((v) => !v)}
                    />
                  </div>
                  <button onClick={() => store.setPhase('idle', '')} className="btn btn-secondary w-full">
                    <ArrowLeft className="w-4 h-4" />
                    Try Again
                  </button>
                </motion.div>
              )}

              {phase === 'complete' && store.presentation && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* Success card */}
                  <div className="glass p-6 border-emerald-500/10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-white truncate">
                          {store.presentation.metadata.title}
                        </p>
                        <p className="text-xs text-slate-400">
                          {store.presentation.slides.length} slides &middot;{' '}
                          ~{store.presentation.metadata.estimatedDuration} min
                        </p>
                      </div>
                    </div>

                    {/* Slide type breakdown */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {Array.from(new Set(store.presentation.slides.map((s) => s.type))).map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-white/[0.04] text-[11px] text-slate-400 border border-white/[0.06]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Cost (subtle) */}
                    {generationCost && (
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-3 border-t border-white/[0.04]">
                        <span>API Cost: ${generationCost.totalCost.toFixed(4)}</span>
                        {generationCost.costs.map((c) => (
                          <span key={c.phase} className="text-slate-600">
                            {c.phase}: {c.phase === 'tts' ? `${c.inputTokens.toLocaleString()} chars` : `${(c.inputTokens + c.outputTokens).toLocaleString()} tokens`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => { store.reset(); store.setPhase('idle', ''); }}
                      className="btn btn-secondary"
                    >
                      <ArrowLeft className="w-4 h-4" /> New
                    </button>
                    <button onClick={handlePlay} className="btn btn-primary">
                      Start Presentation <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

/* ─── Generation Progress Component ─── */
function GenerationProgress({
  phase,
  message,
  onCancel,
}: {
  phase: GenerationPhase;
  message: string;
  onCancel: () => void;
}) {
  const stages: GenerationPhase[] = ['researching', 'designing', 'complete'];
  const currentIdx = stages.indexOf(phase);

  return (
    <div className="space-y-5">
      {/* Pipeline steps */}
      <div className="flex items-center gap-2">
        {stages.map((s, i) => {
          const isActive = s === phase;
          const isDone = i < currentIdx;
          const cfg = PHASE_CONFIG[s];
          const Icon = cfg?.icon || Loader2;

          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg flex-1 transition-all ${
                  isActive
                    ? 'bg-white/[0.06] border border-white/[0.08]'
                    : isDone
                    ? 'bg-emerald-500/5 border border-emerald-500/10'
                    : 'bg-white/[0.02] border border-white/[0.04]'
                }`}
              >
                {isActive ? (
                  <Loader2 className={`w-4 h-4 animate-spin ${cfg?.color || 'text-indigo-400'}`} />
                ) : isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Icon className="w-4 h-4 text-slate-600" />
                )}
                <span className={`text-xs font-medium ${isActive ? 'text-white' : isDone ? 'text-emerald-300/70' : 'text-slate-600'}`}>
                  {cfg?.label || s}
                </span>
              </div>
              {i < stages.length - 1 && (
                <div className={`w-4 h-px ${isDone ? 'bg-emerald-500/30' : 'bg-white/[0.06]'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Message */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{message}</p>
        <button onClick={onCancel} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          Cancel
        </button>
      </div>

      {/* Animated bar */}
      <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
          style={{ width: '50%' }}
        />
      </div>
    </div>
  );
}

function GenerationConsole({
  logs,
  open,
  onToggle,
}: {
  logs: DebugEntry[];
  open: boolean;
  onToggle: () => void;
}) {
  const levelClass: Record<DebugEntry['level'], string> = {
    info: 'text-slate-300',
    warn: 'text-amber-300',
    error: 'text-rose-300',
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#070b18]/70 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-200">Generation Console</span>
          <span className="text-[10px] text-slate-500">{logs.length} events</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/[0.06]"
          >
            <div className="max-h-64 overflow-y-auto p-3 space-y-2 font-mono text-[11px]">
              {logs.length === 0 && (
                <p className="text-slate-500">Waiting for model events...</p>
              )}
              {logs.map((log) => {
                const time = new Date(log.ts);
                const ts = Number.isNaN(time.getTime())
                  ? '--:--:--'
                  : time.toLocaleTimeString([], { hour12: false });

                return (
                  <div key={log.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className={`${levelClass[log.level]} leading-relaxed`}>{log.message}</p>
                      <span className="text-slate-600 shrink-0">{ts}</span>
                    </div>
                    {log.meta !== undefined && (
                      <pre className="mt-1.5 text-[10px] leading-relaxed text-slate-500 whitespace-pre-wrap break-words">
                        {JSON.stringify(log.meta, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
