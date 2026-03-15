'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Sparkles,
  Layers,
  Mic,
  BrainCircuit,
  BarChart3,
  Globe,
  ArrowRight,
  FileText,
  Workflow,
  Zap,
  Play,
  BookOpen,
  GraduationCap,
  Image,
} from 'lucide-react';

/* ─── Animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

/* ─── Data ─── */
const features = [
  {
    icon: BrainCircuit,
    title: 'Dual-AI Pipeline',
    desc: 'Gemini researches & writes, Claude designs — two specialized models working in sequence for the best output.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Mic,
    title: 'Narrated Voiceover',
    desc: 'Professional text-to-speech narration syncs perfectly with each slide, with subtitles you can toggle.',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Sparkles,
    title: 'Built-In Quizzes',
    desc: 'Interactive knowledge checks woven into the presentation flow — test understanding as you learn.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Workflow,
    title: 'Live Diagrams',
    desc: 'Mermaid-powered flowcharts, timelines, process flows, and cycle diagrams rendered in real time.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: BarChart3,
    title: 'Animated Data Viz',
    desc: 'Bar charts, line graphs, pie charts — data visualizations that animate and build before your eyes.',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Image,
    title: 'Smart Images',
    desc: 'AI finds relevant photos — portraits of scientists, historical events, diagrams — to enrich your slides.',
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    icon: Globe,
    title: 'Any Language',
    desc: 'Generate presentations in German, English, Spanish, French, Japanese, Chinese, and many more.',
    gradient: 'from-cyan-500 to-sky-500',
  },
  {
    icon: BookOpen,
    title: 'PDF Import',
    desc: 'Upload your notes, textbooks, or papers — AI extracts the content and builds a complete lesson from it.',
    gradient: 'from-fuchsia-500 to-pink-500',
  },
];

const steps = [
  {
    num: '01',
    icon: FileText,
    title: 'Describe or Upload',
    desc: 'Enter any topic, choose your depth level, or upload a PDF — the AI takes it from there.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    num: '02',
    icon: Zap,
    title: 'AI Generates',
    desc: 'Two AI models work in tandem — creating the script, designing 17 visual slide types, and producing the voiceover.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  {
    num: '03',
    icon: Play,
    title: 'Learn Interactively',
    desc: 'Play the full presentation with animations, narration, quiz interactions, and keyboard navigation.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
];

const slideTypes = [
  'Title', 'BigStatement', 'InfoGrid', 'Timeline', 'Process',
  'Chart', 'Comparison', 'Quiz', 'Diagram', 'Stats',
  'DataTable', 'Cycle', 'Ranked', 'Scenario', 'List', 'Summary', 'Outro',
];

/* ─── Floating Orb Component ─── */
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_100%)]" />
    </div>
  );
}

/* ─── Animated Counter ─── */
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start = 0;
    const duration = 2000;
    const t0 = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.floor(eased * value);
      el.textContent = start.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

export default function LandingPage() {
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="relative min-h-screen bg-[#030712]">
      <FloatingOrbs />

      {/* ─── Navigation ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#030712]/70 border-b border-white/[0.04]">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              EduSlides
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/library')}
              className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2.5"
            >
              Library
            </button>
            <button
              onClick={() => router.push('/create')}
              className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section ref={heroRef} className="relative z-10 pt-32 pb-20 overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroOpacity }}>
          <div className="max-w-6xl mx-auto px-6 text-center">
            <motion.div
              initial="hidden"
              animate="show"
              variants={stagger}
              className="flex flex-col items-center"
            >
              {/* Badge */}
              <motion.div
                custom={0}
                variants={fadeUp}
                className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-indigo-500/25 bg-indigo-500/[0.07] text-indigo-300 text-sm font-medium mb-10 backdrop-blur-sm"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-400" />
                </span>
                Powered by Gemini + Claude
              </motion.div>

              {/* Heading */}
              <motion.h1
                custom={1}
                variants={fadeUp}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] text-balance max-w-5xl"
              >
                <span className="text-white">Turn any topic into</span>
                <br />
                <span className="hero-gradient-text">
                  a living presentation
                </span>
              </motion.h1>

              {/* Subheading */}
              <motion.p
                custom={2}
                variants={fadeUp}
                className="mt-8 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed text-balance"
              >
                Type a topic or upload your notes. Two AI models collaborate to build
                slides, diagrams, charts, quizzes, and synchronized voiceover — 
                streamed in real time.
              </motion.p>

              {/* CTA Row */}
              <motion.div
                custom={3}
                variants={fadeUp}
                className="mt-12 flex flex-col sm:flex-row gap-4 items-center"
              >
                <button
                  onClick={() => router.push('/create')}
                  className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_100%] animate-gradient-x text-white text-base font-semibold shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-500 hover:-translate-y-1"
                >
                  <Sparkles className="w-5 h-5" />
                  Create Presentation
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
                <button
                  onClick={() => {
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-6 py-4 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                  See how it works
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </motion.div>
          </div>

          {/* ─── Hero Preview Card ─── */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-24 max-w-5xl mx-auto px-6"
          >
            <div className="relative group">
              {/* Glow ring */}
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0f1e]/80 backdrop-blur-sm overflow-hidden shadow-2xl">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-white/[0.08]" />
                    <div className="w-3 h-3 rounded-full bg-white/[0.08]" />
                    <div className="w-3 h-3 rounded-full bg-white/[0.08]" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-lg bg-white/[0.04] text-[11px] text-slate-500 font-mono">
                      eduslides.app/player
                    </div>
                  </div>
                </div>
                
                {/* Slide content */}
                <div className="aspect-video relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0c1029] via-[#0f1535] to-[#0a0d1f]" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.2, duration: 0.6 }}
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8 tracking-wide uppercase"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      Leistungskurs
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.4, duration: 0.6 }}
                      className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 text-center"
                    >
                      Polytraumata im Sport
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.6, duration: 0.6 }}
                      className="text-slate-400 text-lg max-w-lg text-center"
                    >
                      Pathophysiologie, Erstversorgung und Rehabilitation
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.9, duration: 0.6 }}
                      className="flex items-center gap-6 mt-10 text-sm text-slate-500"
                    >
                      <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> 15 Slides</span>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <span className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> 5 Min</span>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <span className="flex items-center gap-1.5"><Mic className="w-3.5 h-3.5" /> Voiceover</span>
                    </motion.div>
                  </div>
                  
                  {/* Fake player controls */}
                  <div className="absolute bottom-0 left-0 right-0 px-5 py-3 bg-gradient-to-t from-black/40 to-transparent">
                    <div className="h-1 rounded-full bg-white/10 mb-3">
                      <motion.div
                        className="h-full rounded-full bg-indigo-500"
                        initial={{ width: '0%' }}
                        animate={{ width: '35%' }}
                        transition={{ delay: 2.2, duration: 2, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-white/40">
                      <Play className="w-4 h-4" />
                      <span className="text-xs font-mono">1:42 / 5:00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Slide Types Ticker ─── */}
      <section className="relative z-10 py-12 border-y border-white/[0.04] overflow-hidden">
        <div className="flex items-center gap-8 animate-ticker">
          {[...slideTypes, ...slideTypes].map((t, i) => (
            <span key={i} className="text-sm text-slate-600 whitespace-nowrap font-medium tracking-wide flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" />
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="relative z-10 max-w-6xl mx-auto px-6 py-32">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="text-center mb-20"
        >
          <motion.p
            custom={0}
            variants={fadeUp}
            className="text-sm font-semibold text-indigo-400 tracking-widest uppercase mb-4"
          >
            How It Works
          </motion.p>
          <motion.h2
            custom={1}
            variants={fadeUp}
            className="text-4xl sm:text-5xl font-bold text-white"
          >
            Three steps. That&apos;s it.
          </motion.h2>
        </motion.div>

        <div className="relative grid md:grid-cols-3 gap-8">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-emerald-500/20" />
          
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="relative"
            >
              <div className={`card group !p-8 hover:!border-opacity-30 ${step.border}`}>
                <div className={`w-14 h-14 rounded-2xl ${step.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className={`w-7 h-7 ${step.color}`} />
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-sm font-bold ${step.color} font-mono`}>{step.num}</span>
                  <h3 className="text-xl font-bold text-white">
                    {step.title}
                  </h3>
                </div>
                <p className="text-[15px] text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="text-center mb-20"
        >
          <motion.p
            custom={0}
            variants={fadeUp}
            className="text-sm font-semibold text-indigo-400 tracking-widest uppercase mb-4"
          >
            Capabilities
          </motion.p>
          <motion.h2
            custom={1}
            variants={fadeUp}
            className="text-4xl sm:text-5xl font-bold text-white mb-5"
          >
            Everything you need to learn
          </motion.h2>
          <motion.p
            custom={2}
            variants={fadeUp}
            className="text-lg text-slate-400 max-w-xl mx-auto"
          >
            17 unique slide types, AI-powered visuals, and real-time generation.
          </motion.p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="group relative"
            >
              <div className="card !p-6 h-full hover:!bg-white/[0.05] transition-all duration-300">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 shadow-lg`}
                  style={{ boxShadow: `0 8px 24px -8px rgba(99, 102, 241, 0.2)` }}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="relative z-10 border-y border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { value: 17, suffix: '', label: 'Slide Types' },
              { value: 2, suffix: '', label: 'AI Models' },
              { value: 8, suffix: '+', label: 'Languages' },
              { value: 3, suffix: '', label: 'Voice Engines' },
            ].map((stat, i) => (
              <motion.div key={stat.label} custom={i} variants={fadeUp} className="text-center">
                <div className="text-4xl sm:text-5xl font-extrabold text-white mb-2 tabular-nums">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative z-10 py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
            variants={stagger}
          >
            <motion.div
              custom={0}
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/[0.07] border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8"
            >
              <Zap className="w-4 h-4" />
              Ready in minutes
            </motion.div>
            <motion.h2
              custom={1}
              variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 text-balance"
            >
              Start learning smarter.
            </motion.h2>
            <motion.p
              custom={2}
              variants={fadeUp}
              className="text-xl text-slate-400 mb-12 max-w-lg mx-auto"
            >
              Create your first AI-generated interactive presentation right now — no signup required.
            </motion.p>
            <motion.div custom={3} variants={fadeUp}>
              <button
                onClick={() => router.push('/create')}
                className="group relative inline-flex items-center gap-3 px-12 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_100%] animate-gradient-x text-white text-lg font-semibold shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-500 hover:-translate-y-1"
              >
                <Sparkles className="w-5 h-5" />
                Create a Presentation
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-400">EduSlides</span>
          </div>
          <p className="text-sm text-slate-600">
            AI-powered interactive learning presentations
          </p>
        </div>
      </footer>
    </div>
  );
}
