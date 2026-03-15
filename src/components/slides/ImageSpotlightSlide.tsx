'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ImageSpotlightContent } from '@/lib/types';

/* Ken Burns CSS animations */
const kenBurnsStyles: Record<string, React.CSSProperties> = {
  'zoom-in': {
    animation: 'kb-zoom-in 20s ease-in-out infinite alternate',
  },
  'zoom-out': {
    animation: 'kb-zoom-out 20s ease-in-out infinite alternate',
  },
  'pan-left': {
    animation: 'kb-pan-left 20s ease-in-out infinite alternate',
  },
  'pan-right': {
    animation: 'kb-pan-right 20s ease-in-out infinite alternate',
  },
};

const overlayPositionClasses: Record<string, string> = {
  'bottom-left': 'items-end justify-start',
  'bottom-right': 'items-end justify-end',
  'top-left': 'items-start justify-start',
  center: 'items-center justify-center',
};

export default function ImageSpotlightSlide({
  content,
  imageUrl,
}: {
  content: ImageSpotlightContent;
  imageUrl?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const pos = content.overlayPosition || 'bottom-left';
  const kb = content.kenBurns || 'zoom-in';

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Ken Burns keyframes */}
      <style>{`
        @keyframes kb-zoom-in { from { transform: scale(1); } to { transform: scale(1.15); } }
        @keyframes kb-zoom-out { from { transform: scale(1.15); } to { transform: scale(1); } }
        @keyframes kb-pan-left { from { transform: scale(1.12) translateX(3%); } to { transform: scale(1.12) translateX(-3%); } }
        @keyframes kb-pan-right { from { transform: scale(1.12) translateX(-3%); } to { transform: scale(1.12) translateX(3%); } }
      `}</style>

      {/* Image */}
      {imageUrl && !error ? (
        <img
          src={imageUrl}
          alt={content.caption}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={kenBurnsStyles[kb]}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        /* Fallback gradient when no image */
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-white" />
      )}

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {/* Text overlay */}
      <div className={`absolute inset-0 flex flex-col ${overlayPositionClasses[pos]} p-10 z-10`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className={`max-w-lg ${pos === 'center' ? 'text-center' : ''}`}
        >
          {/* Chapter badge */}
          <div className="text-xs font-semibold tracking-widest uppercase text-white/70 mb-2">
            {content.chapter} &mdash; {content.heading}
          </div>

          {/* Caption */}
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2 drop-shadow-lg">
            {content.caption}
          </h2>

          {/* Description */}
          <p className="text-sm sm:text-base text-white/90 leading-relaxed drop-shadow">
            {content.description}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
