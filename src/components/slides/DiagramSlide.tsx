'use client';

import { motion } from 'framer-motion';
import type { DiagramContent } from '@/lib/types';

/* ─── Layout Renderers ─── */

function BodyLayout({ content }: { content: DiagramContent }) {
  return (
    <svg viewBox="0 0 200 400" className="w-full h-full max-h-[90%]">
      <ellipse cx="100" cy="40" rx="22" ry="28" fill="rgba(0,0,0,0.03)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      <path d="M100 68 L100 220 M100 110 L55 180 M100 110 L145 180 M100 220 L65 350 M100 220 L135 350"
        stroke="rgba(0,0,0,0.1)" strokeWidth="2" strokeLinecap="round" fill="none" />
      {content.nodes.map((node, i) => {
        const cx = (node.x / 100) * 200;
        const cy = (node.y / 100) * 400;
        const r = node.size === 'lg' ? 12 : node.size === 'sm' ? 6 : 9;
        return (
          <g key={node.id}>
            <motion.circle
              cx={cx} cy={cy} r={r}
              fill={node.color}
              fillOpacity={0.2}
              stroke={node.color}
              strokeWidth={1.5}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.15, duration: 0.4 }}
            />
            <motion.text
              x={cx + r + 6} y={cy + 4}
              fill="#334155"
              fontSize="10"
              fontWeight="600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 + i * 0.15 }}
            >
              {node.label}
            </motion.text>
          </g>
        );
      })}
    </svg>
  );
}

function RadialLayout({ content }: { content: DiagramContent }) {
  const nodes = content.nodes;
  const cx = 200, cy = 200, radius = 140;
  return (
    <svg viewBox="0 0 400 400" className="w-full h-full max-h-[90%]">
      {content.centerLabel && (
        <g>
          <circle cx={cx} cy={cy} r="40" fill="rgba(0,0,0,0.03)" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
          <text x={cx} y={cy + 4} textAnchor="middle" fill="#334155" fontSize="11" fontWeight="700">{content.centerLabel}</text>
        </g>
      )}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" strokeDasharray="4 4" />
      {nodes.map((node, i) => {
        const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
        const nx = cx + Math.cos(angle) * radius;
        const ny = cy + Math.sin(angle) * radius;
        const r = node.size === 'lg' ? 28 : node.size === 'sm' ? 16 : 22;
        return (
          <g key={node.id}>
            <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={`${node.color}30`} strokeWidth="1" strokeDasharray="3 3" />
            <motion.circle
              cx={nx} cy={ny} r={r}
              fill={`${node.color}15`}
              stroke={node.color}
              strokeWidth={1.5}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.15, duration: 0.5 }}
            />
            <motion.text
              x={nx} y={ny + 4}
              textAnchor="middle"
              fill="#334155"
              fontSize="9"
              fontWeight="600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.15 }}
            >
              {node.label}
            </motion.text>
          </g>
        );
      })}
    </svg>
  );
}

function ScatterLayout({ content }: { content: DiagramContent }) {
  return (
    <svg viewBox="0 0 400 400" className="w-full h-full max-h-[90%]">
      {content.connections?.map((conn, i) => {
        const from = content.nodes.find((n) => n.id === conn.from);
        const to = content.nodes.find((n) => n.id === conn.to);
        if (!from || !to) return null;
        const x1 = (from.x / 100) * 400, y1 = (from.y / 100) * 400;
        const x2 = (to.x / 100) * 400, y2 = (to.y / 100) * 400;
        return (
          <motion.line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="1"
            strokeDasharray={conn.style === 'dashed' ? '5 5' : undefined}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
          />
        );
      })}
      {content.nodes.map((node, i) => {
        const nx = (node.x / 100) * 400;
        const ny = (node.y / 100) * 400;
        const r = node.size === 'lg' ? 24 : node.size === 'sm' ? 12 : 18;
        return (
          <g key={node.id}>
            <motion.circle
              cx={nx} cy={ny} r={r}
              fill={`${node.color}15`}
              stroke={node.color}
              strokeWidth={1.5}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.12, duration: 0.4 }}
            />
            <motion.text
              x={nx} y={ny - r - 6}
              textAnchor="middle"
              fill="#334155"
              fontSize="10"
              fontWeight="600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 + i * 0.12 }}
            >
              {node.label}
            </motion.text>
          </g>
        );
      })}
    </svg>
  );
}

function FlowLayout({ content }: { content: DiagramContent }) {
  const nodes = content.nodes;
  const gap = 400 / (nodes.length + 1);
  return (
    <svg viewBox="0 0 400 200" className="w-full h-full max-h-[90%]">
      {nodes.map((node, i) => {
        const nx = gap * (i + 1);
        const ny = 100;
        return (
          <g key={node.id}>
            {i < nodes.length - 1 && (
              <motion.line
                x1={nx + 30} y1={ny} x2={gap * (i + 2) - 30} y2={ny}
                stroke="rgba(0,0,0,0.12)"
                strokeWidth="1.5"
                markerEnd="url(#arrowhead)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.15 }}
              />
            )}
            <motion.rect
              x={nx - 28} y={ny - 28} width="56" height="56" rx="14"
              fill={`${node.color}12`}
              stroke={node.color}
              strokeWidth={1.5}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
            />
            <text x={nx} y={ny + 4} textAnchor="middle" fill="#334155" fontSize="9" fontWeight="600">
              {node.label}
            </text>
          </g>
        );
      })}
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(0,0,0,0.25)" />
        </marker>
      </defs>
    </svg>
  );
}

function LayersLayout({ content }: { content: DiagramContent }) {
  const nodes = content.nodes;
  const bandH = 360 / nodes.length;
  return (
    <svg viewBox="0 0 400 400" className="w-full h-full max-h-[90%]">
      {nodes.map((node, i) => (
        <g key={node.id}>
          <motion.rect
            x="20" y={20 + i * bandH} width="360" height={bandH - 4} rx="8"
            fill={`${node.color}10`}
            stroke={`${node.color}30`}
            strokeWidth="1"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
            style={{ transformOrigin: 'center' }}
          />
          <motion.text
            x="200" y={20 + i * bandH + bandH / 2 + 4}
            textAnchor="middle" fill="#334155" fontSize="11" fontWeight="600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.12 }}
          >
            {node.label}
          </motion.text>
        </g>
      ))}
    </svg>
  );
}

const layoutMap: Record<string, React.FC<{ content: DiagramContent }>> = {
  body: BodyLayout,
  radial: RadialLayout,
  scatter: ScatterLayout,
  flow: FlowLayout,
  layers: LayersLayout,
};

export default function DiagramSlide({ content }: { content: DiagramContent }) {
  const Layout = layoutMap[content.layout] || ScatterLayout;

  return (
    <div className="flex h-full px-8 py-8 gap-6 overflow-hidden">
      {/* Diagram area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-3 shrink-0"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">
            {content.chapter}
          </span>
          <h2 className="text-2xl font-bold text-slate-800">{content.heading}</h2>
        </motion.div>
        <div className="flex-1 flex items-center justify-center min-h-0">
          <Layout content={content} />
        </div>
      </div>

      {/* Info list sidebar */}
      {content.infoList?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="w-72 shrink-0 flex flex-col gap-2.5 overflow-y-auto py-2"
        >
          {content.infoList.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="rounded-xl p-3 border border-slate-200 bg-white/60 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                {item.value && (
                  <span className="text-xs font-mono ml-auto" style={{ color: item.color }}>
                    {item.value}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
