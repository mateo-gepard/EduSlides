import { create } from 'zustand';
import type {
  Presentation,
  GenerationConfig,
  GenerationPhase,
} from '@/lib/types';

interface CostBreakdown {
  phase: string;
  provider: string;
  inputCost: number;
  outputCost: number;
  total: number;
  inputTokens: number;
  outputTokens: number;
}

interface GenerationCost {
  costs: CostBreakdown[];
  totalCost: number;
}

interface PresentationState {
  /* ─── Data ─── */
  presentation: Presentation | null;
  audioMap: Record<string, string>;

  /* ─── Playback ─── */
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  showSubtitles: boolean;

  /* ─── Generation ─── */
  phase: GenerationPhase;
  phaseMessage: string;
  generationCost: GenerationCost | null;

  /* ─── Config ─── */
  config: GenerationConfig;

  /* ─── Actions ─── */
  setPresentation: (p: Presentation) => void;
  setAudio: (slideId: string, url: string) => void;
  setCurrentIndex: (i: number) => void;
  next: () => void;
  prev: () => void;
  setIsPlaying: (v: boolean) => void;
  togglePlay: () => void;
  setVolume: (v: number) => void;
  setShowSubtitles: (v: boolean) => void;
  setPhase: (phase: GenerationPhase, msg?: string) => void;
  setError: (msg: string) => void;
  setConfig: (partial: Partial<GenerationConfig>) => void;
  setGenerationCost: (cost: GenerationCost) => void;
  reset: () => void;
}

const defaultConfig: GenerationConfig = {
  topic: '',
  subject: '',
  depth: 'Grundkurs (standard)',
  duration: 5,
  language: 'Deutsch',
  additionalContext: '',
  scriptProvider: 'gemini',
  designProvider: 'anthropic',
  ttsProvider: 'browser',
};

export const usePresentationStore = create<PresentationState>((set, get) => ({
  presentation: null,
  audioMap: {},
  currentIndex: 0,
  isPlaying: false,
  volume: 0.8,
  showSubtitles: true,
  phase: 'idle',
  phaseMessage: '',
  generationCost: null,
  config: defaultConfig,

  setPresentation: (p) => set({ presentation: p, currentIndex: 0, audioMap: {} }),
  setAudio: (id, url) =>
    set((s) => ({ audioMap: { ...s.audioMap, [id]: url } })),
  setCurrentIndex: (i) => set({ currentIndex: i }),
  next: () => {
    const { presentation, currentIndex } = get();
    if (presentation && currentIndex < presentation.slides.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    }
  },
  prev: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) set({ currentIndex: currentIndex - 1 });
  },
  setIsPlaying: (v) => set({ isPlaying: v }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setVolume: (v) => set({ volume: v }),
  setShowSubtitles: (v) => set({ showSubtitles: v }),
  setPhase: (phase, msg) =>
    set({ phase, phaseMessage: msg || '' }),
  setError: (msg) =>
    set({ phase: 'error', phaseMessage: msg }),
  setConfig: (partial) =>
    set((s) => ({ config: { ...s.config, ...partial } })),
  setGenerationCost: (cost) => set({ generationCost: cost }),
  reset: () =>
    set({
      presentation: null,
      audioMap: {},
      currentIndex: 0,
      isPlaying: false,
      phase: 'idle',
      phaseMessage: '',
      generationCost: null,
    }),
}));
