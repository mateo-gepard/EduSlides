'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Layers,
  Mic,
  BrainCircuit,
  BarChart3,
  Globe,
  ChevronRight,
  ArrowRight,
  FileText,
  Workflow,
} from 'lucide-react';

/* ─── Animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};

/* ─── Data ─── */
const features = [
  {
    icon: BrainCircuit,
    title: 'AI-Powered Content',
    desc: 'Claude or GPT-4o generates pedagogically structured, accurate presentations from any topic.',
  },
  {
    icon: Mic,
    title: 'Synchronized Voiceover',
    desc: 'Professional text-to-speech narration that plays in perfect sync with each slide transition.',
  },
  {
    icon: Sparkles,
    title: 'Interactive Quizzes',
    desc: 'Knowledge checks woven into the flow — test understanding as you learn, not just at the end.',
  },
  {
    icon: Workflow,
    title: 'Dynamic Diagrams',
    desc: 'Mermaid-powered flowcharts, sequence diagrams, and more — rendered and animated in real time.',
  },
  {
    icon: BarChart3,
    title: 'Animated Charts',
    desc: 'Bar charts, line graphs, pie charts — data visualizations that build before your eyes.',
  },
  {
    icon: Globe,
    title: 'Any Language',
    desc: 'Generate presentations in German, English, Spanish, French, and dozens more languages.',
  },
];

const steps = [
  {
    num: '01',
    icon: FileText,
    title: 'Describe or Upload',
    desc: 'Enter a topic and set your depth level — or upload a PDF and let AI extract the content.',
  },
  {
    num: '02',
    icon: Layers,
    title: 'AI Generates',
    desc: 'The model designs slides, diagrams, charts, quizzes, and a full voiceover script — streamed in real time.',
  },
  {
    num: '03',
    icon: Sparkles,
    title: 'Learn Interactively',
    desc: 'Play the presentation with synchronized narration, answer quizzes, and explore visual explanations.',
  },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen">
      {/* Mesh background */}
      <div className="mesh-bg" />

      {/* ─── Navigation ─── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            EduSlides
          </span>
        </div>
        <button
          onClick={() => router.push('/create')}
          className="btn btn-primary text-sm"
        >
          Get Started
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-32 text-center">
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
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-sm font-medium mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Interactive Learning
          </motion.div>

          {/* Heading */}
          <motion.h1
            custom={1}
            variants={fadeUp}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] text-balance"
          >
            <span className="text-white">Transform any topic into</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
              an interactive lesson
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            custom={2}
            variants={fadeUp}
            className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed text-balance"
          >
            Type a topic or upload your notes. AI builds a complete
            presentation — slides, diagrams, charts, quizzes, and synchronized
            voiceover — ready to play in minutes.
          </motion.p>

          {/* CTA */}
          <motion.div
            custom={3}
            variants={fadeUp}
            className="mt-10 flex gap-4"
          >
            <button
              onClick={() => router.push('/create')}
              className="btn btn-primary text-base px-8 py-3"
            >
              Create Presentation
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </motion.div>
        </motion.div>

        {/* Hero Preview */}
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 relative"
        >
          <div className="slide-frame mx-auto shadow-2xl shadow-indigo-500/5 border border-white/[0.06]">
            <div className="slide-inner items-center text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-6 tracking-wide uppercase">
                Preview
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Polytraumata im Sport
              </h2>
              <p className="text-slate-400 text-lg max-w-md">
                Pathophysiologie, Erstversorgung und Rehabilitation
              </p>
              <div className="flex items-center gap-6 mt-8 text-sm text-slate-500">
                <span>15 Slides</span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>5 Min</span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>Leistungskurs</span>
              </div>
            </div>
          </div>
          {/* Glow under preview */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-indigo-500/8 blur-3xl rounded-full pointer-events-none" />
        </motion.div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.p
            custom={0}
            variants={fadeUp}
            className="text-sm font-medium text-indigo-400 tracking-wide uppercase mb-3"
          >
            How It Works
          </motion.p>
          <motion.h2
            custom={1}
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold text-white"
          >
            Three steps to interactive learning
          </motion.h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="card group"
            >
              <div className="flex items-center gap-4 mb-5">
                <span className="text-3xl font-bold text-indigo-500/30 tabular-nums">
                  {step.num}
                </span>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/15 transition-colors">
                  <step.icon className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.p
            custom={0}
            variants={fadeUp}
            className="text-sm font-medium text-indigo-400 tracking-wide uppercase mb-3"
          >
            Capabilities
          </motion.p>
          <motion.h2
            custom={1}
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold text-white"
          >
            Built for serious learning
          </motion.h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="card group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/15 transition-colors">
                <f.icon className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-[15px] font-semibold text-white mb-1.5">
                {f.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-24 text-center">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          variants={stagger}
        >
          <motion.h2
            custom={0}
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
          >
            Ready to transform how you learn?
          </motion.h2>
          <motion.p
            custom={1}
            variants={fadeUp}
            className="text-lg text-slate-400 mb-8"
          >
            Create your first interactive presentation in minutes.
          </motion.p>
          <motion.div custom={2} variants={fadeUp}>
            <button
              onClick={() => router.push('/create')}
              className="btn btn-primary text-base px-8 py-3"
            >
              Start Creating
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-white/[0.05] py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Layers className="w-2.5 h-2.5 text-white" />
            </div>
            <span>EduSlides</span>
          </div>
          <span>AI-powered interactive learning</span>
        </div>
      </footer>
    </div>
  );
}
