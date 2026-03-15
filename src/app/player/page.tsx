'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Subtitles,
  Maximize,
  Minimize,
  ArrowLeft,
  Layers,
} from 'lucide-react';
import { usePresentationStore } from '@/stores/presentation-store';
import SlideRenderer from '@/components/SlideRenderer';

/* ─── Transition variants ─── */
const transitionVariants: Record<string, object> = {
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  slide: { initial: { opacity: 0, x: 80 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -80 } },
  zoom: { initial: { opacity: 0, scale: 1.1 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 } },
  scale: { initial: { opacity: 0, scale: 0.85 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.1 } },
};

export default function PlayerPage() {
  const router = useRouter();
  const store = usePresentationStore();
  const { presentation, audioMap, currentIndex, isPlaying, volume, showSubtitles } = store;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const slideStartRef = useRef<number>(Date.now());

  const [elapsed, setElapsed] = useState(0);
  const [subtitle, setSubtitle] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const slides = presentation?.slides || [];
  const slide = slides[currentIndex];
  const totalSlides = slides.length;

  /* ─── No presentation → redirect ─── */
  useEffect(() => {
    if (!presentation) router.replace('/create');
  }, [presentation, router]);

  /* ─── Elapsed timer ─── */
  useEffect(() => {
    if (!isPlaying || !slide) return;
    slideStartRef.current = Date.now();
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((Date.now() - slideStartRef.current) / 1000);
    }, 200);
    return () => clearInterval(timerRef.current);
  }, [isPlaying, currentIndex, slide]);

  /* ─── Narration subtitle sync ─── */
  useEffect(() => {
    if (!slide?.narration?.length || !showSubtitles) {
      setSubtitle('');
      return;
    }
    const cues = slide.narration;
    let current = '';
    for (const cue of cues) {
      if (elapsed >= cue.t) current = cue.text;
    }
    setSubtitle(current);
  }, [elapsed, slide, showSubtitles]);

  /* ─── Auto-advance ─── */
  useEffect(() => {
    if (!isPlaying || !slide) return;
    if (elapsed >= slide.duration) {
      if (currentIndex < totalSlides - 1) {
        store.next();
      } else {
        store.setIsPlaying(false);
      }
    }
  }, [elapsed, isPlaying, slide, currentIndex, totalSlides, store]);

  /* ─── Audio / TTS playback ─── */
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    stopAudio();
    if (!slide || !isPlaying) return;

    const slideId = slide.id;
    const audioUrl = audioMap[slideId];

    if (audioUrl) {
      // Pre-generated audio
      const audio = new Audio(audioUrl);
      audio.volume = volume;
      audioRef.current = audio;
      audio.play().catch(() => {});
    } else if (store.config.ttsProvider === 'browser' && slide.narration?.length) {
      // Browser TTS fallback
      const text = slide.narration.map((n) => n.text).join(' ');
      if (text && typeof window !== 'undefined' && window.speechSynthesis) {
        const utt = new SpeechSynthesisUtterance(text);
        utt.volume = volume;
        utt.rate = 0.95;
        synthRef.current = utt;
        window.speechSynthesis.speak(utt);
      }
    }

    return stopAudio;
  }, [currentIndex, isPlaying, audioMap, slide, volume, stopAudio, store.config.ttsProvider]);

  /* ─── Volume change ─── */
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  /* ─── Keyboard navigation ─── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          store.togglePlay();
          break;
        case 'ArrowRight':
        case 'l':
          store.next();
          break;
        case 'ArrowLeft':
        case 'j':
          store.prev();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 's':
          store.setShowSubtitles(!showSubtitles);
          break;
        case 'm':
          store.setVolume(volume > 0 ? 0 : 0.8);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [store, showSubtitles, volume]);

  /* ─── Fullscreen ─── */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  /* ─── Auto-hide controls ─── */
  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    if (!isPlaying) setShowControls(true);
  }, [isPlaying]);

  if (!presentation || !slide) return null;

  const transition = slide.transition || 'fade';
  const variants = transitionVariants[transition] || transitionVariants.fade;
  const progress = slide.duration > 0 ? Math.min(elapsed / slide.duration, 1) : 0;

  return (
    <div
      className="relative w-full h-screen bg-[#020617] overflow-hidden select-none"
      onMouseMove={showControlsTemporarily}
      onClick={showControlsTemporarily}
    >
      {/* ─── Slide frame ─── */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative w-full h-full max-w-[177.78vh] max-h-[56.25vw] overflow-hidden"
          style={{ aspectRatio: '16/9' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              {...variants}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
              style={{ background: slide.background }}
            >
              <SlideRenderer slide={slide} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Subtitle overlay ─── */}
      <AnimatePresence>
        {showSubtitles && subtitle && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 max-w-3xl"
          >
            <div className="px-6 py-3 rounded-xl bg-black/70 backdrop-blur-sm text-white text-sm sm:text-base text-center leading-relaxed">
              {subtitle}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Top bar ─── */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -20 }}
        transition={{ duration: 0.3 }}
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-3 bg-gradient-to-b from-black/50 to-transparent pointer-events-auto"
      >
        <button
          onClick={() => { stopAudio(); router.push('/create'); }}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit
        </button>
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs text-white/50 font-medium truncate max-w-[240px]">
            {presentation.metadata.title}
          </span>
        </div>
        <span className="text-xs text-white/40 font-mono tabular-nums">
          {currentIndex + 1} / {totalSlides}
        </span>
      </motion.div>

      {/* ─── Bottom controls ─── */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-auto"
      >
        {/* Slide progress bar */}
        <div className="px-5 mb-1">
          <div
            className="h-1 rounded-full bg-white/10 cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              slideStartRef.current = Date.now() - pct * (slide.duration * 1000);
              setElapsed(pct * slide.duration);
            }}
          >
            <div
              className="h-full rounded-full bg-indigo-500 relative transition-all group-hover:h-1.5"
              style={{ width: `${progress * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 px-5 py-3">
          {/* Prev */}
          <button
            onClick={() => store.prev()}
            disabled={currentIndex === 0}
            className="text-white/60 hover:text-white disabled:text-white/20 transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => store.togglePlay()}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          {/* Next */}
          <button
            onClick={() => store.next()}
            disabled={currentIndex >= totalSlides - 1}
            className="text-white/60 hover:text-white disabled:text-white/20 transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Time */}
          <span className="text-xs text-white/40 font-mono tabular-nums ml-2">
            {Math.floor(elapsed)}s / {slide.duration}s
          </span>

          <div className="flex-1" />

          {/* Volume */}
          <div className="flex items-center gap-2 group">
            <button
              onClick={() => store.setVolume(volume > 0 ? 0 : 0.8)}
              className="text-white/50 hover:text-white transition-colors"
            >
              {volume > 0 ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => store.setVolume(Number(e.target.value))}
              className="w-20 accent-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>

          {/* Subtitles */}
          <button
            onClick={() => store.setShowSubtitles(!showSubtitles)}
            className={`transition-colors ${showSubtitles ? 'text-indigo-400' : 'text-white/30 hover:text-white/60'}`}
          >
            <Subtitles className="w-4.5 h-4.5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="text-white/50 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize className="w-4.5 h-4.5" /> : <Maximize className="w-4.5 h-4.5" />}
          </button>
        </div>

        {/* Global progress (all slides) */}
        <div className="h-0.5 bg-white/[0.04]">
          <div
            className="h-full bg-indigo-500/40 transition-all duration-300"
            style={{ width: `${((currentIndex + progress) / totalSlides) * 100}%` }}
          />
        </div>
      </motion.div>
    </div>
  );
}
