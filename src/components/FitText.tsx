'use client';

import { type ReactNode } from 'react';

interface FitTextProps {
  children: ReactNode;
  text: string;
  min?: number;
  max?: number;
  className?: string;
}

/**
 * Scales font-size inversely with text length so short content fills the space
 * and long content doesn't overflow.
 */
export default function FitText({ children, text, min = 16, max = 64, className = '' }: FitTextProps) {
  const len = text.length;
  // Short text → max font, long text → min font. Breakpoints tuned for slide readability.
  let size: number;
  if (len <= 30) size = max;
  else if (len <= 60) size = max - ((len - 30) / 30) * (max - max * 0.7);
  else if (len <= 120) size = max * 0.7 - ((len - 60) / 60) * (max * 0.7 - max * 0.45);
  else if (len <= 250) size = max * 0.45 - ((len - 120) / 130) * (max * 0.45 - min);
  else size = min;

  size = Math.max(min, Math.round(size));

  return (
    <div className={className} style={{ fontSize: size, lineHeight: 1.25 }}>
      {children}
    </div>
  );
}
