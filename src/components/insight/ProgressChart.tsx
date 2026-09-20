'use client';

import { useMemo } from 'react';
import type { SeriesPoint } from '@/domain/game/history';
import { cs } from '@/i18n/cs';
import { Eyebrow } from '@/components/ui';

const W = 300;
const H = 72;
const PAD = 6;

/**
 * Jedna řada, jeden graf.
 *
 * Nasbírané a zlaté vlajky jsou schválně dva grafy pod sebou, ne dvě čáry
 * v jednom: zlaté jsou podmnožina nasbíraných, takže společná osa by
 * svádělak čtení „rozdílu“, který nic neznamená. Každý graf má tím pádem
 * jednu barvu a nepotřebuje legendu – název řady je v nadpisu.
 *
 * Barvy jsou tokeny aplikace (mint = sbírka, gold = nejvyšší úroveň).
 * Drží význam, který mají všude jinde v rozhraní.
 */
function Sparkline({
  points,
  color,
  max,
}: {
  points: number[];
  color: string;
  max: number;
}) {
  const { line, area, last } = useMemo(() => {
    const top = Math.max(max, 1);
    const stepX = points.length > 1 ? (W - PAD * 2) / (points.length - 1) : 0;
    const y = (value: number) => H - PAD - (value / top) * (H - PAD * 2);
    const coords = points.map((value, i) => [PAD + i * stepX, y(value)] as const);

    const line = coords.map(([x, yy], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${yy.toFixed(1)}`).join(' ');
    const first = coords[0];
    const end = coords[coords.length - 1];
    const area =
      first && end
        ? `${line} L${end[0].toFixed(1)} ${H - PAD} L${first[0].toFixed(1)} ${H - PAD} Z`
        : '';
    return { line, area, last: end };
  }, [points, max]);

  if (points.length === 0) return null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden="true">
      {/* Základna – jediná linka v pozadí, ať se dá odhadnout nula. */}
      <line
        x1={PAD}
        y1={H - PAD}
        x2={W - PAD}
        y2={H - PAD}
        stroke="rgb(255 255 255 / 0.12)"
        strokeWidth={1}
      />
      <path d={area} fill={color} opacity={0.14} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {last ? <circle cx={last[0]} cy={last[1]} r={4} fill={color} /> : null}
    </svg>
  );
}

export function ProgressChart({
  points,
  total,
}: {
  points: SeriesPoint[];
  /** Kolik vlajek je v sadě – strop obou grafů. */
  total: number;
}) {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last || points.length < 2) return null;

  const rows = [
    {
      key: 'collected' as const,
      label: cs.insight.chartCollected,
      color: 'var(--color-mint)',
      values: points.map((p) => p.collected),
      now: last.collected,
      change: last.collected - first.collected,
    },
    {
      key: 'gold' as const,
      label: cs.insight.chartGold,
      color: 'var(--color-gold)',
      values: points.map((p) => p.gold),
      now: last.gold,
      change: last.gold - first.gold,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {rows.map((row) => (
        <div key={row.key}>
          <div className="flex items-baseline justify-between gap-3">
            <Eyebrow>{row.label}</Eyebrow>
            <span className="text-[0.72rem] font-bold tabular-nums text-faint">
              {cs.insight.chartChange(row.change, points.length)}
            </span>
          </div>
          <p className="display mt-0.5 text-2xl tabular-nums" style={{ color: row.color }}>
            {row.now}
            <span className="ml-1.5 text-sm font-bold text-faint">z {total}</span>
          </p>
          <div className="mt-1.5">
            <Sparkline points={row.values} color={row.color} max={total} />
          </div>
        </div>
      ))}
    </div>
  );
}
