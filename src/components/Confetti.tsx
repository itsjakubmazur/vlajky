'use client';

import { useEffect, useMemo, useState } from 'react';
import { createRng } from '@/domain/rng';

const COLORS = ['#4f46e5', '#e8a800', '#0f9d58', '#e0475b', '#22b8cf', '#f06595'];

/**
 * Oslava po zlaté vlajce nebo dokončeném světadílu.
 * Žádná knihovna – pár obdélníčků a CSS animace stačí a nic to nestojí.
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
          className="absolute top-[-5vh] block animate-[confetti-fall_linear_forwards]"
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
