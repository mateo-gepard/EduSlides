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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { usePresentationStore } from '@/stores/presentation-store';
import SlideRenderer from '@/components/SlideRenderer';
import SlideQA from '@/components/SlideQA';
import AmbientParticles from '@/components/AmbientParticles';
import SlideBackground from '@/components/SlideBackground';

/* ─── Transition variants ─── */
const variants: Record<string, object> = {
  fade:  { initial: { opacity: 0 },              animate: { opacity: 1 },            exit: { opacity: 0 } },
  slide: { initial: { opacity: 0, x: 60 },       animate: { opacity: 1, x: 0 },     exit: { opacity: 0, x: -60 } },
  zoom:  { initial: { opacity: 0, scale: 1.08 }, animate: { opacity: 1, scale: 1 },  exit: { opacity: 0, scale: 0.92 } },
  scale: { initial: { opacity: 0, scale: 0.9 },  animate: { opacity: 1, scale: 1 },  exit: { opacity: 0, scale: 1.08 } },
  wipe:  { initial: { clipPath: 'inset(0 100% 0 0)' }, animate: { clipPath: 'inset(0 0% 0 0)' }, exit: { clipPath: 'inset(0 0 0 100%)' } },
  blur:  { initial: { opacity: 0, filter: 'blur(12px)' }, animate: { opacity: 1, filter: 'blur(0px)' }, exit: { opacity: 0, filter: 'blur(12px)' } },
  flip:  { initial: { opacity: 0, rotateY: 90 },  animate: { opacity: 1, rotateY: 0 }, exit: { opacity: 0, rotateY: -90 } },
};

/* ─── Format seconds → "0:05" ─── */
function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function PlayerPage() {
  const router = useRouter();
  const store = usePresentationStore();
  const { presentation, audioMap, currentIndex, isPlaying, volume, showSubtitles, config } = store;
  const {
    setAudio,
    next,
    prev,
    setIsPlaying,
    togglePlay,
    setVolume,
    setShowSubtitles,
    setCurrentIndex,
  } = store;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const delayedStartRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playTokenRef = useRef(0);
  const prefetchRunRef = useRef(0);
  const ttsPromiseRef = useRef<Map<string, Promise<string | null>>>(new Map());
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const slideStartRef = useRef<number>(Date.now());
  const currentIndexRef = useRef(currentIndex);
  const isPlayingRef = useRef(isPlaying);
  const audioMapRef = useRef(audioMap);

  const [elapsed, setElapsed] = useState(0);
  const [subtitle, setSubtitle] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const ttsGeneratingRef = useRef<Set<string>>(new Set());
  const [audioMinDuration, setAudioMinDuration] = useState(0);

  const slides = presentation?.slides || [];
  const slide = slides[currentIndex];
  const totalSlides = slides.length;
  const currentAudioUrl = slide ? audioMap[slide.id] : undefined;
  const effectiveSlideDuration = Math.max(slide?.duration || 0, audioMinDuration);

  useEffect(() => {
    setAudioMinDuration(0);
  }, [currentIndex]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
    isPlayingRef.current = isPlaying;
  }, [currentIndex, isPlaying]);

  useEffect(() => {
    audioMapRef.current = audioMap;
  }, [audioMap]);

  /* ─── Lock body scroll ─── */
  useEffect(() => {
    const scrollY = window.scrollY;
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyPosition = document.body.style.position;
    const prevBodyTop = document.body.style.top;
    const prevBodyLeft = document.body.style.left;
    const prevBodyRight = document.body.style.right;
    const prevBodyWidth = document.body.style.width;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.documentElement.style.overflow = 'hidden';

    const preventScroll = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const allowInteraction = Boolean(target?.closest('input[type="range"], textarea, input'));
      if (!allowInteraction) e.preventDefault();
    };
    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('wheel', preventScroll, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventScroll as EventListener);
      document.removeEventListener('wheel', preventScroll as EventListener);
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.position = prevBodyPosition;
      document.body.style.top = prevBodyTop;
      document.body.style.left = prevBodyLeft;
      document.body.style.right = prevBodyRight;
      document.body.style.width = prevBodyWidth;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

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
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [isPlaying, currentIndex, slide]);

  /* ─── Narration subtitle sync ─── */
  useEffect(() => {
    if (!slide?.narration?.length || !showSubtitles) { setSubtitle(''); return; }
    const cues = slide.narration;
    const cueElapsed = currentAudioUrl ? Math.max(0, elapsed - 2) : elapsed;
    let current = '';
    for (const cue of cues) { if (cueElapsed >= cue.t) current = cue.text; }
    setSubtitle(current);
  }, [elapsed, slide, showSubtitles, currentAudioUrl]);

  /* ─── Auto-advance ─── */
  useEffect(() => {
    if (!isPlaying || !slide) return;
    if (elapsed >= effectiveSlideDuration) {
      if (currentIndex < totalSlides - 1) next();
      else setIsPlaying(false);
    }
  }, [elapsed, isPlaying, effectiveSlideDuration, currentIndex, totalSlides, slide, next, setIsPlaying]);

  /* ─── Audio / TTS playback ─── */
  const stopAudio = useCallback(() => {
    if (delayedStartRef.current) {
      clearTimeout(delayedStartRef.current);
      delayedStartRef.current = null;
    }
    playTokenRef.current += 1;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  const ensureProviderAudio = useCallback(async (targetSlide?: (typeof slides)[number]) => {
    if (!targetSlide?.id || !targetSlide.narration?.length) return null;
    if (config.ttsProvider === 'browser') return null;
    const cached = audioMapRef.current[targetSlide.id];
    if (cached) return cached;
    const inflight = ttsPromiseRef.current.get(targetSlide.id);
    if (inflight) return await inflight;

    const promise = (async () => {
      ttsGeneratingRef.current.add(targetSlide.id);
      try {
        const text = targetSlide.narration.map((n) => n.text).join(' ');
        if (!text.trim()) return null;
        const ttsRes = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, provider: config.ttsProvider }),
        });
        if (!ttsRes.ok) throw new Error('TTS generation failed');
        const blob = await ttsRes.blob();
        const generatedUrl = URL.createObjectURL(blob);
        setAudio(targetSlide.id, generatedUrl);
        return generatedUrl;
      } catch {
        return null;
      } finally {
        ttsGeneratingRef.current.delete(targetSlide.id);
        ttsPromiseRef.current.delete(targetSlide.id);
      }
    })();

    ttsPromiseRef.current.set(targetSlide.id, promise);
    return await promise;
  }, [config.ttsProvider, setAudio]);

  // Prewarm provider TTS for current and next slide to keep starts close to 2s lead-in.
  useEffect(() => {
    if (!slides.length) return;
    if (config.ttsProvider === 'browser') return;

    const current = slides[currentIndex];
    const nextSlide = slides[currentIndex + 1];
    void ensureProviderAudio(current);
    void ensureProviderAudio(nextSlide);
  }, [slides, currentIndex, config.ttsProvider, ensureProviderAudio]);

  // Keep generating provider audio in background to avoid random per-slide delays.
  useEffect(() => {
    if (!slides.length) return;
    if (config.ttsProvider === 'browser') return;

    const runId = ++prefetchRunRef.current;
    const queue = slides
      .slice(currentIndex)
      .filter((s) => s.narration?.length && !audioMapRef.current[s.id]);

    let cursor = 0;
    const worker = async () => {
      while (cursor < queue.length) {
        if (prefetchRunRef.current !== runId) return;
        const idx = cursor;
        cursor += 1;
        await ensureProviderAudio(queue[idx]);
      }
    };

    void Promise.all([worker(), worker()]);

    return () => {
      if (prefetchRunRef.current === runId) prefetchRunRef.current += 1;
    };
  }, [slides, currentIndex, config.ttsProvider, ensureProviderAudio]);

  useEffect(() => {
    stopAudio();
    if (!slide || !isPlaying) return;

    const targetIndex = currentIndex;
    const scheduleDelayedPlay = (audio: HTMLAudioElement) => {
      const token = ++playTokenRef.current;
      if (delayedStartRef.current) clearTimeout(delayedStartRef.current);

      // Keep a strict 2s lead-in relative to slide start, not relative to when audio becomes available.
      const leadInMs = 2000;
      const elapsedSinceSlideStartMs = Date.now() - slideStartRef.current;
      const delayMs = Math.max(0, leadInMs - elapsedSinceSlideStartMs);

      delayedStartRef.current = setTimeout(() => {
        // Guard against stale delayed starts after slide skip.
        if (token !== playTokenRef.current) return;
        if (currentIndexRef.current !== targetIndex) return;
        if (!isPlayingRef.current) return;

        const guardedPlay = () => {
          if (token !== playTokenRef.current) return;
          if (currentIndexRef.current !== targetIndex) return;
          if (!isPlayingRef.current) return;
          audio.play().catch(() => {
            // If data is not ready yet, retry once when the audio can play.
            const onCanPlay = () => {
              audio.removeEventListener('canplay', onCanPlay);
              if (token !== playTokenRef.current) return;
              if (currentIndexRef.current !== targetIndex) return;
              if (!isPlayingRef.current) return;
              audio.play().catch(() => {});
            };
            audio.addEventListener('canplay', onCanPlay, { once: true });
          });
        };

        guardedPlay();
      }, delayMs);
    };

    const playBrowserTts = () => {
      if (!slide.narration?.length) return;
      const text = slide.narration.map((n) => n.text).join(' ');
      if (text && typeof window !== 'undefined' && window.speechSynthesis) {
        const utt = new SpeechSynthesisUtterance(text);
        utt.volume = volume;
        utt.rate = 0.95;
        synthRef.current = utt;
        window.speechSynthesis.speak(utt);
      }
    };

    if (currentAudioUrl) {
      const audio = new Audio(currentAudioUrl);
      audio.volume = volume;
      audioRef.current = audio;
      audio.preload = 'auto';
      audio.load();
      audio.onloadedmetadata = () => {
        const minDur = Math.ceil(audio.duration + 4); // 2s lead-in + 2s tail buffer
        if (Number.isFinite(minDur) && minDur > 0) setAudioMinDuration(minDur);
      };
      scheduleDelayedPlay(audio);
    } else if (config.ttsProvider !== 'browser' && slide.narration?.length) {
      void ensureProviderAudio(slide)
        .then((generatedUrl) => {
          if (!generatedUrl) {
            playBrowserTts();
            return;
          }

          // If user is still on this slide and playing, start generated audio immediately.
          if (currentIndexRef.current === currentIndex && isPlayingRef.current) {
            stopAudio();
            const audio = new Audio(generatedUrl);
            audio.volume = volume;
            audioRef.current = audio;
            audio.preload = 'auto';
            audio.load();
            audio.onloadedmetadata = () => {
              const minDur = Math.ceil(audio.duration + 4); // 2s lead-in + 2s tail buffer
              if (Number.isFinite(minDur) && minDur > 0) setAudioMinDuration(minDur);
            };
            scheduleDelayedPlay(audio);
          }
        });
    } else if (slide.narration?.length) {
      playBrowserTts();
    }
    return () => {
      stopAudio();
    };
  }, [currentIndex, isPlaying, currentAudioUrl, slide, volume, stopAudio, config.ttsProvider, ensureProviderAudio]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  /* ─── Keyboard ─── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't capture keys when typing in QA input
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); break;
        case 'ArrowRight': case 'l': next(); break;
        case 'ArrowLeft': case 'j': prev(); break;
        case 'f': toggleFullscreen(); break;
        case 's': setShowSubtitles(!showSubtitles); break;
        case 'm': setVolume(volume > 0 ? 0 : 0.8); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSubtitles, volume, togglePlay, next, prev, setShowSubtitles, setVolume]);

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
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
  }, [isPlaying]);

  useEffect(() => { if (!isPlaying) setShowControls(true); }, [isPlaying]);

  if (!presentation || !slide) return null;

  const trans = slide.transition || 'fade';
  const v = variants[trans] || variants.fade;
  const progress = effectiveSlideDuration > 0 ? Math.min(elapsed / effectiveSlideDuration, 1) : 0;
  return (
    <div
      className="player-shell"
      onMouseMove={showControlsTemporarily}
    >
      {/* ═══ Ambient glow behind the slide ═══ */}
      <div className="player-ambient" />

      {/* ═══ Slide viewport ═══ */}
      <div className="absolute inset-0 flex items-center justify-center z-[1]">
        <div className="player-viewport">
          {/* Subtle rounded bezel */}
          <div className="player-bezel">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                {...v}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                {/* Layered background system */}
                <SlideBackground background={slide.background} />
                {/* Ambient particles */}
                <AmbientParticles
                  theme={slide.particleTheme || 'bokeh'}
                  accentColor={presentation.metadata.accentColor || '#818cf8'}
                  opacity={0.6}
                />
                {/* Ken Burns camera motion wrapper */}
                <motion.div
                  className="absolute inset-0"
                  initial={{ scale: 1.0 }}
                  animate={{ scale: 1.06 }}
                  transition={{ duration: effectiveSlideDuration || 8, ease: 'linear' }}
                  key={`kb-${slide.id}`}
                >
                  <SlideRenderer slide={slide} />
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Edge navigation zones (click left/right thirds) */}
          <div className="absolute inset-y-0 left-0 w-1/4 z-10 cursor-pointer group"
            onClick={() => prev()}>
            <div className="absolute inset-y-0 left-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <ChevronLeft className="w-5 h-5 text-white/80" />
              </div>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 w-1/4 z-10 cursor-pointer group"
            onClick={() => next()}>
            <div className="absolute inset-y-0 right-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <ChevronRight className="w-5 h-5 text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Subtitle overlay ═══ */}
      <AnimatePresence>
        {showSubtitles && subtitle && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 max-w-2xl px-4"
          >
            <p className="player-subtitle text-center mx-auto">{subtitle}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Top bar ═══ */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -12 }}
        transition={{ duration: 0.25 }}
        className="absolute top-0 inset-x-0 z-20 pointer-events-none"
      >
        <div className="player-topbar pointer-events-auto">
          <button
            onClick={() => { stopAudio(); router.push('/create'); }}
            className="player-btn-ghost"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/[0.06]">
            <span className="text-[13px] text-white/70 font-medium truncate max-w-[300px]">
              {presentation.metadata.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 font-mono tabular-nums">
              {currentIndex + 1}/{totalSlides}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ═══ AI Q&A ═══ */}
      {slide && presentation && (
        <SlideQA slide={slide} presentationTitle={presentation.metadata.title}
          language={presentation.metadata.language || 'English'} />
      )}

      {/* ═══ Bottom control bar ═══ */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 16 }}
        transition={{ duration: 0.25 }}
        className="absolute bottom-0 inset-x-0 z-20 pointer-events-none"
      >
        <div className="player-controls pointer-events-auto">
          {/* Slide progress bar */}
          <div className="px-4 pt-3 pb-1">
            <div
              className="player-progress-track group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                slideStartRef.current = Date.now() - pct * (effectiveSlideDuration * 1000);
                setElapsed(pct * effectiveSlideDuration);
              }}
            >
              <div className="player-progress-fill" style={{ width: `${progress * 100}%` }}>
                <div className="player-progress-thumb" />
              </div>
            </div>
          </div>

          {/* Control buttons row */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-4 pb-3 pt-1">
            {/* Play / Pause */}
            <button onClick={() => togglePlay()} className="player-btn-play">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            {/* Prev / Next */}
            <button
              onClick={() => prev()}
              disabled={currentIndex === 0}
              className="player-btn-icon"
            >
              <SkipBack className="w-[18px] h-[18px]" />
            </button>
            <button
              onClick={() => next()}
              disabled={currentIndex >= totalSlides - 1}
              className="player-btn-icon"
            >
              <SkipForward className="w-[18px] h-[18px]" />
            </button>

            {/* Time */}
            <span className="text-[11px] sm:text-xs text-white/40 font-mono tabular-nums ml-1 select-none">
              {fmt(elapsed)} / {fmt(effectiveSlideDuration)}
            </span>

            <div className="flex-1" />

            {/* Volume group */}
            <div className="hidden sm:flex items-center gap-1.5 group/vol">
              <button onClick={() => setVolume(volume > 0 ? 0 : 0.8)} className="player-btn-icon">
                {volume > 0 ? <Volume2 className="w-[18px] h-[18px]" /> : <VolumeX className="w-[18px] h-[18px]" />}
              </button>
              <input
                type="range" min={0} max={1} step={0.05} value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="player-volume-slider"
              />
            </div>

            {/* Subtitles */}
            <button
              onClick={() => setShowSubtitles(!showSubtitles)}
              className={`player-btn-icon ${showSubtitles ? '!text-indigo-400' : ''}`}
            >
              <Subtitles className="w-[18px] h-[18px]" />
            </button>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="player-btn-icon">
              {isFullscreen ? <Minimize className="w-[18px] h-[18px]" /> : <Maximize className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ═══ Slide dots (mini-map above controls) ═══ */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls ? 1 : 0 }}
        className="absolute bottom-[72px] left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
      >
        <div className="flex items-center gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`transition-all duration-200 rounded-full ${
                i === currentIndex
                  ? 'w-6 h-1.5 bg-indigo-400'
                  : i < currentIndex
                    ? 'w-1.5 h-1.5 bg-white/30 hover:bg-white/50'
                    : 'w-1.5 h-1.5 bg-white/15 hover:bg-white/30'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
