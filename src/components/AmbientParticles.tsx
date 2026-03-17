'use client';

import { useEffect, useRef } from 'react';

export type ParticleTheme = 'bokeh' | 'geometric' | 'stars' | 'organic' | 'none';

interface Props {
  theme?: ParticleTheme;
  accentColor?: string;
  opacity?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  alphaTarget: number;
  alphaSpeed: number;
  hue: number;
  sat: number;
  light: number;
  shape: 'circle' | 'diamond' | 'ring' | 'star' | 'dot';
  rotation: number;
  rotationSpeed: number;
  pulse: number;
  pulseSpeed: number;
}

function hexToHSL(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

function createParticles(
  count: number,
  w: number,
  h: number,
  theme: ParticleTheme,
  hsl: [number, number, number],
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const baseHue = hsl[0] + (Math.random() - 0.5) * 40;
    const baseSat = Math.max(20, hsl[1] + (Math.random() - 0.5) * 30);
    const baseLight = Math.max(40, Math.min(85, hsl[2] + (Math.random() - 0.5) * 20));

    let shape: Particle['shape'] = 'circle';
    let size = 2 + Math.random() * 4;
    if (theme === 'geometric') {
      shape = (['circle', 'diamond', 'ring'] as const)[Math.floor(Math.random() * 3)];
      size = 3 + Math.random() * 6;
    } else if (theme === 'stars') {
      shape = Math.random() > 0.3 ? 'dot' : 'star';
      size = shape === 'star' ? 2 + Math.random() * 3 : 1 + Math.random() * 2;
    } else if (theme === 'organic') {
      shape = 'circle';
      size = 4 + Math.random() * 10;
    } else {
      // bokeh
      shape = 'circle';
      size = 6 + Math.random() * 18;
    }

    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2 - 0.1,
      size,
      alpha: Math.random() * 0.3,
      alphaTarget: 0.1 + Math.random() * 0.25,
      alphaSpeed: 0.002 + Math.random() * 0.004,
      hue: baseHue,
      sat: baseSat,
      light: baseLight,
      shape,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.01,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02,
    });
  }
  return particles;
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  const pulseFactor = 1 + Math.sin(p.pulse) * 0.15;
  const s = p.size * pulseFactor;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.globalAlpha = p.alpha;

  const color = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, 1)`;

  switch (p.shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      break;

    case 'dot':
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      break;

    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.7, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.7, 0);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      break;

    case 'ring':
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
      break;

    case 'star': {
      const spikes = 4;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? s : s * 0.4;
        const angle = (i * Math.PI) / spikes;
        if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

const PARTICLE_COUNTS: Record<ParticleTheme, number> = {
  bokeh: 25,
  geometric: 30,
  stars: 50,
  organic: 20,
  none: 0,
};

export default function AmbientParticles({ theme = 'bokeh', accentColor = '#818cf8', opacity = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (theme === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect() || { width: 960, height: 540 };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const hsl = hexToHSL(accentColor);
    const count = PARTICLE_COUNTS[theme];
    const rect = canvas.parentElement?.getBoundingClientRect() || { width: 960, height: 540 };
    particlesRef.current = createParticles(count, rect.width, rect.height, theme, hsl);

    const animate = () => {
      const w = (canvas.parentElement?.getBoundingClientRect().width) || 960;
      const h = (canvas.parentElement?.getBoundingClientRect().height) || 540;

      ctx.clearRect(0, 0, w, h);

      for (const p of particlesRef.current) {
        // Movement
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.pulse += p.pulseSpeed;

        // Fade toward target alpha
        if (p.alpha < p.alphaTarget) p.alpha = Math.min(p.alphaTarget, p.alpha + p.alphaSpeed);
        else if (p.alpha > p.alphaTarget) p.alpha = Math.max(p.alphaTarget, p.alpha - p.alphaSpeed);

        // Occasionally retarget alpha
        if (Math.random() < 0.002) {
          p.alphaTarget = 0.05 + Math.random() * 0.3;
        }

        // Wrap around edges
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        drawParticle(ctx, p);
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [theme, accentColor]);

  if (theme === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity }}
    />
  );
}
