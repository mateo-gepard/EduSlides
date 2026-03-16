/* ═══════════════════════════════════════════════════════════════
   EduSlides — Universal Slide Type System

   Every type is a VISUAL PRIMITIVE, not a domain concept.
   "diagram" = positioned nodes + connections (body, atom, circuit, map)
   "cycle"   = N-node relationship (lethal triad, E=mc², trilemma)
   "ranked"  = items with % bars (risk, efficiency, importance)
   "process" = ordered steps (ABCDE, scientific method, proof)
   ═══════════════════════════════════════════════════════════════ */

export type SlideType =
  | 'title'
  | 'big-statement'
  | 'info-grid'
  | 'diagram'
  | 'data-table'
  | 'process'
  | 'timeline'
  | 'cycle'
  | 'stats'
  | 'ranked'
  | 'scenario'
  | 'list'
  | 'chart'
  | 'comparison'
  | 'quiz'
  | 'summary'
  | 'outro'
  | 'formula'
  | 'graph'
  | 'quote'
  | 'infographic'
  | 'image-spotlight'
  | 'funfact'
  | 'definition'
  | 'code';

/* ─── Presentation ─── */

export interface Presentation {
  metadata: PresentationMeta;
  slides: Slide[];
}

export interface PresentationMeta {
  title: string;
  subtitle: string;
  subject: string;
  level: string;
  language: string;
  estimatedDuration: number;
  totalSlides: number;
  accentColor: string;
}

export interface Slide {
  id: string;
  index: number;
  type: SlideType;
  transition: 'fade' | 'slide' | 'zoom' | 'scale';
  duration: number;
  background: string;
  content: SlideContent;
  narration: { t: number; text: string }[];
  imageQuery?: string;
  imageUrl?: string;
}

/* ─── Content Union ─── */

export type SlideContent =
  | TitleContent
  | BigStatementContent
  | InfoGridContent
  | DiagramContent
  | DataTableContent
  | ProcessContent
  | TimelineContent
  | CycleContent
  | StatsContent
  | RankedContent
  | ScenarioContent
  | ListContent
  | ChartContent
  | ComparisonContent
  | QuizContent
  | SummaryContent
  | OutroContent
  | FormulaContent
  | GraphContent
  | QuoteContent
  | InfographicContent
  | ImageSpotlightContent
  | FunFactContent
  | DefinitionContent
  | CodeContent;

/* ═══════ Slide Content Types (all universal) ═══════ */

/** Cinematic opener: badge, giant title, subtitle, meta pills */
export interface TitleContent {
  type: 'title';
  badge: string;
  title: string;
  subtitle: string;
  meta: { icon: string; text: string }[];
}

/** Single hero statement: equation, quote, shocking fact */
export interface BigStatementContent {
  type: 'big-statement';
  chapter: string;
  heading: string;
  statement: string;
  description: string;
  source?: string;
  accent: string;
}

/** Grid of 2–6 cards (definitions, features, properties, causes, anything) */
export interface InfoGridContent {
  type: 'info-grid';
  chapter: string;
  heading: string;
  cards: {
    icon: string;
    color: string;
    title: string;
    text: string;
    highlight?: { text: string; source?: string };
  }[];
}

/**
 * Positioned nodes + connections on a 2D canvas.
 *
 * layout hints:
 * - "body"    → human silhouette with markers (anatomy, injuries)
 * - "radial"  → nodes orbit a center (cell, atom, solar system)
 * - "scatter" → freeform positioned (spacetime, map, concept map)
 * - "flow"    → left→right directed graph (circuits, pipelines)
 * - "layers"  → stacked horizontal bands (atmosphere, earth layers, OSI)
 *
 * The renderer builds beautiful SVG from the data.
 * infoList side panel shows details for each node.
 */
export interface DiagramContent {
  type: 'diagram';
  chapter: string;
  heading: string;
  layout: 'body' | 'radial' | 'scatter' | 'flow' | 'layers';
  centerLabel?: string;
  nodes: {
    id: string;
    x: number;
    y: number;
    label: string;
    color: string;
    size?: 'sm' | 'md' | 'lg';
  }[];
  connections?: {
    from: string;
    to: string;
    label?: string;
    style?: 'solid' | 'dashed' | 'arrow';
  }[];
  infoList: {
    nodeId: string;
    label: string;
    description: string;
    value?: string;
    color: string;
  }[];
}

/** Table with severity badges + optional calculator/example panel */
export interface DataTableContent {
  type: 'data-table';
  chapter: string;
  heading: string;
  headers: string[];
  rows: {
    cells: string[];
    badge?: { text: string; level: 'low' | 'med' | 'high' | 'critical' | 'max' };
  }[];
  example?: {
    title: string;
    description: string;
    items: { label: string; value: string; color: string }[];
    formula?: string;
    result: { value: string; label: string };
  };
}

/** Ordered step cards — any sequential process */
export interface ProcessContent {
  type: 'process';
  chapter: string;
  heading: string;
  description?: string;
  steps: {
    label: string;
    name: string;
    description: string;
    color: string;
  }[];
}

/** Vertical timeline + optional side bar chart */
export interface TimelineContent {
  type: 'timeline';
  chapter: string;
  heading: string;
  events: {
    time: string;
    icon: string;
    title: string;
    description: string;
    color: string;
  }[];
  sideChart?: {
    title: string;
    source?: string;
    bars: {
      label: string;
      displayValue: string;
      percent: number;
      color: string;
    }[];
  };
}

/**
 * Cyclical/triangular relationship between 2–4 concepts.
 * Polytrauma → lethal triad. Physics → E/m/c. Econ → impossible trinity.
 */
export interface CycleContent {
  type: 'cycle';
  chapter: string;
  heading: string;
  centerLabel: string;
  centerSub: string;
  nodes: {
    icon: string;
    value: string;
    label: string;
    description: string;
    color: string;
  }[];
}

/** Animated number counters in a grid */
export interface StatsContent {
  type: 'stats';
  chapter: string;
  heading: string;
  items: {
    icon: string;
    value: number;
    suffix?: string;
    label: string;
    color: string;
  }[];
}

/** Cards with progress bars — any ranked or compared items */
export interface RankedContent {
  type: 'ranked';
  chapter: string;
  heading: string;
  items: {
    icon: string;
    title: string;
    description: string;
    percent: number;
    percentLabel: string;
    color: string;
  }[];
}

/** Case study / thought experiment / problem walkthrough */
export interface ScenarioContent {
  type: 'scenario';
  chapter: string;
  heading: string;
  subject: { icon: string; title: string; description: string };
  steps: {
    badge: string;
    color: string;
    text: string;
  }[];
}

/** Numbered items with descriptions (recommendations, principles, laws) */
export interface ListContent {
  type: 'list';
  chapter: string;
  heading: string;
  items: { title: string; text: string }[];
  accent: string;
}

/** Bar or pie chart */
export interface ChartContent {
  type: 'chart';
  chapter: string;
  heading: string;
  chartType: 'bar' | 'pie';
  source?: string;
  bars?: {
    label: string;
    displayValue: string;
    percent: number;
    color: string;
  }[];
  segments?: {
    label: string;
    value: number;
    color: string;
  }[];
  centerLabel?: string;
}

/** Multi-column comparison */
export interface ComparisonContent {
  type: 'comparison';
  chapter: string;
  heading: string;
  columns: {
    title: string;
    color: string;
    points: string[];
  }[];
}

/** Interactive quiz with 2–5 questions */
export interface QuizContent {
  type: 'quiz';
  chapter: string;
  heading: string;
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

/** Recap grid of key takeaways */
export interface SummaryContent {
  type: 'summary';
  chapter: string;
  heading: string;
  items: { icon: string; title: string; text: string }[];
}

/** Closing slide with sources */
export interface OutroContent {
  type: 'outro';
  icon: string;
  title: string;
  message: string;
  sources: string[];
}

/* ═══════ New Slide Content Types ═══════ */

/** LaTeX formula with optional step-by-step derivation */
export interface FormulaContent {
  type: 'formula';
  chapter: string;
  heading: string;
  formula: string;
  description: string;
  steps?: { label: string; formula: string; explanation: string }[];
  accent: string;
}

/** Mathematical function graph / data plot with labeled axes */
export interface GraphContent {
  type: 'graph';
  chapter: string;
  heading: string;
  graphType: 'function' | 'data' | 'multi';
  xLabel: string;
  yLabel: string;
  xRange?: [number, number];
  yRange?: [number, number];
  functions?: {
    expression: string;   // e.g. "x^2", "sin(x)", "2*x+1"
    label: string;        // e.g. "f(x) = x²"
    color: string;
    dashed?: boolean;
  }[];
  dataPoints?: {
    label: string;
    color: string;
    points: { x: number; y: number }[];
    showLine?: boolean;
  }[];
  annotations?: { x: number; y: number; text: string; color: string }[];
  gridLines?: boolean;
  source?: string;
}

/** Blockquote with author attribution */
export interface QuoteContent {
  type: 'quote';
  chapter: string;
  heading: string;
  quote: string;
  author: string;
  role?: string;
  year?: string;
  context?: string;
  accent: string;
}

/** Visual data narrative: icons + numbers + flowing layout */
export interface InfographicContent {
  type: 'infographic';
  chapter: string;
  heading: string;
  layout: 'vertical' | 'horizontal' | 'centered';
  items: {
    icon: string;
    value: string;
    label: string;
    description: string;
    color: string;
  }[];
  connector?: string;
}

/** Full-bleed image with Ken Burns animation + text overlay */
export interface ImageSpotlightContent {
  type: 'image-spotlight';
  chapter: string;
  heading: string;
  imageQuery: string;
  caption: string;
  description: string;
  overlayPosition: 'bottom-left' | 'bottom-right' | 'top-left' | 'center';
  kenBurns: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right';
}

/** Eye-catching trivia / fun-fact card */
export interface FunFactContent {
  type: 'funfact';
  chapter: string;
  heading: string;
  icon: string;
  fact: string;
  explanation: string;
  source?: string;
  accent: string;
}

/** Term definition card(s) with optional related terms */
export interface DefinitionContent {
  type: 'definition';
  chapter: string;
  heading: string;
  terms: {
    term: string;
    pronunciation?: string;
    partOfSpeech?: string;
    definition: string;
    example?: string;
    relatedTerms?: string[];
    color: string;
  }[];
}

/** Syntax-highlighted code block with explanation */
export interface CodeContent {
  type: 'code';
  chapter: string;
  heading: string;
  language: string;
  code: string;
  highlights?: number[];
  explanation: string;
  output?: string;
  accent: string;
}

/* ─── App Config ─── */

export type ScriptProvider = 'gemini' | 'anthropic' | 'openai';
export type DesignProvider = 'anthropic' | 'anthropic-haiku' | 'openai';
export type TTSProvider = 'openai' | 'elevenlabs' | 'browser';

export interface GenerationConfig {
  topic: string;
  subject: string;
  depth: string;
  duration: number;
  language: string;
  additionalContext: string;
  scriptProvider: ScriptProvider;
  designProvider: DesignProvider;
  ttsProvider: TTSProvider;
}

export type GenerationPhase =
  | 'idle'
  | 'researching'         // Phase 1: Gemini writing the script
  | 'designing'           // Phase 2: Claude compiling visual slides
  | 'generating-audio'    // Phase 3: TTS
  | 'complete'
  | 'error';

/**
 * Intermediate script format produced by Phase 1 (Gemini).
 * Educational content without visual design decisions.
 */
export interface EducationalScript {
  title: string;
  subtitle: string;
  subject: string;
  level: string;
  accentColor: string;
  sections: ScriptSection[];
  quizQuestions: ScriptQuiz[];
  sources: string[];
}

export interface ScriptSection {
  heading: string;
  keyPoints: string[];
  narration: string;
  suggestedVisual: string; // hint like "diagram", "timeline", "stats", "comparison"
  data?: Record<string, unknown>; // any structured data (stats, table rows, etc.)
  imageQuery?: string; // optional image search query when a photo would help
}

export interface ScriptQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
