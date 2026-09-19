'use client';

import { useEffect, useMemo, useState } from 'react';
import { createRng } from '@/domain/rng';

/** Barvy z palety aplikace, ne náhodná duha. */
const COLORS = ['#19e3b1', '#ffc24b', '#ff6b6b', '#c3cfe6', '#4cc9f0'];

/**
 * Oslava po zlaté vlajce nebo dokončeném světadílu.
 * Žádná knihovna – pár obdélníčků a CSS animace stačí.
 */
export function Confetti({ seed = 1, pieces = 60 }: { seed?: number; pieces?: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(timer);
  }, []);

  const items = useMemo(() => {
    const rng = createRng(seed);
    return Array.from({ length: pieces }, (_, i) => ({
      id: i,
      left: rng() * 100,
      delay: rng() * 400,
      duration: 1400 + rng() * 1200,
      rotate: rng() * 360,
      color: COLORS[Math.floor(rng() * COLORS.length)]!,
      size: 6 + rng() * 8,
    }));
  }, [seed, pieces]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden motion-reduce:hidden"
    >
      {items.map((item) => (
        <span
          key={item.id}
          className="absolute top-[-5vh] block rounded-[1px] animate-[confetti-fall_linear_forwards]"
          style={{
            left: `${item.left}%`,
            width: item.size,
            height: item.size * 0.6,
            backgroundColor: item.color,
            animationDelay: `${item.delay}ms`,
            animationDuration: `${item.duration}ms`,
            transform: `rotate(${item.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
