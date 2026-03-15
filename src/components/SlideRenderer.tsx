'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { Slide, SlideContent } from '@/lib/types';

/* Dynamic imports to keep bundle splitting sane */
const TitleSlide = dynamic(() => import('./slides/TitleSlide'));
const BigStatementSlide = dynamic(() => import('./slides/BigStatementSlide'));
const InfoGridSlide = dynamic(() => import('./slides/InfoGridSlide'));
const DiagramSlide = dynamic(() => import('./slides/DiagramSlide'));
const DataTableSlide = dynamic(() => import('./slides/DataTableSlide'));
const ProcessSlide = dynamic(() => import('./slides/ProcessSlide'));
const TimelineSlide = dynamic(() => import('./slides/TimelineSlide'));
const CycleSlide = dynamic(() => import('./slides/CycleSlide'));
const StatsSlide = dynamic(() => import('./slides/StatsSlide'));
const RankedSlide = dynamic(() => import('./slides/RankedSlide'));
const ScenarioSlide = dynamic(() => import('./slides/ScenarioSlide'));
const ListSlide = dynamic(() => import('./slides/ListSlide'));
const ChartSlide = dynamic(() => import('./slides/ChartSlide'));
const ComparisonSlide = dynamic(() => import('./slides/ComparisonSlide'));
const QuizSlide = dynamic(() => import('./slides/QuizSlide'));
const SummarySlide = dynamic(() => import('./slides/SummarySlide'));
const OutroSlide = dynamic(() => import('./slides/OutroSlide'));

/* eslint-disable @typescript-eslint/no-explicit-any */
const renderers: Record<string, React.ComponentType<{ content: any }>> = {
  title: TitleSlide,
  'big-statement': BigStatementSlide,
  'info-grid': InfoGridSlide,
  diagram: DiagramSlide,
  'data-table': DataTableSlide,
  process: ProcessSlide,
  timeline: TimelineSlide,
  cycle: CycleSlide,
  stats: StatsSlide,
  ranked: RankedSlide,
  scenario: ScenarioSlide,
  list: ListSlide,
  chart: ChartSlide,
  comparison: ComparisonSlide,
  quiz: QuizSlide,
  summary: SummarySlide,
  outro: OutroSlide,
};

export default function SlideRenderer({ slide }: { slide: Slide }) {
  const content = slide.content as SlideContent;
  const type = content?.type || slide.type;
  const Renderer = renderers[type];

  if (!Renderer) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        Unknown slide type: {type}
      </div>
    );
  }

  return (
    <>
      <Renderer content={content} />
      {slide.imageUrl && <SlideImage url={slide.imageUrl} />}
    </>
  );
}

function SlideImage({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) return null;

  return (
    <div
      className={`absolute right-[4%] bottom-[14%] w-[16%] rounded-xl overflow-hidden shadow-2xl shadow-black/60 border border-white/[0.08] z-10 transition-opacity duration-700 ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <img
        src={url}
        alt=""
        className="w-full h-auto block"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
