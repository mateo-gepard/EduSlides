'use client';

import { useMemo } from 'react';

interface Props {
  background?: string;
  className?: string;
}

// SVG noise texture as data URI (static, no network request)
const NOISE_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E`;

// Subtle dot grid pattern
const DOT_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='0.5' fill='white' opacity='0.08'/%3E%3C/svg%3E`;

function parseGradientColors(bg: string): string[] {
  const hexMatches = bg.match(/#[0-9a-fA-F]{6}/g);
  if (hexMatches && hexMatches.length >= 2) return hexMatches;
  return ['#0f172a', '#1e1b4b'];
}

export default function SlideBackground({ background = '', className = '' }: Props) {
  const colors = useMemo(() => parseGradientColors(background), [background]);

  // Create a richer gradient from the base colors
  const enhancedGradient = useMemo(() => {
    if (background.includes('gradient')) return background;
    if (colors.length >= 2) {
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
    }
    return background || 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)';
  }, [background, colors]);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Layer 1: Main gradient */}
      <div
        className="absolute inset-0"
        style={{ background: enhancedGradient }}
      />

      {/* Layer 2: Radial highlight (top center glow) */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${colors[0]}40 0%, transparent 70%)`,
        }}
      />

      {/* Layer 3: Bottom vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 120% 80% at 50% 100%, rgba(0,0,0,0.3) 0%, transparent 60%)',
        }}
      />

      {/* Layer 4: Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage: `url("${NOISE_SVG}")`,
          backgroundRepeat: 'repeat',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Layer 5: Dot grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${DOT_SVG}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Layer 6: Edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: 'inset 0 0 120px 40px rgba(0,0,0,0.25)',
        }}
      />
    </div>
  );
}
