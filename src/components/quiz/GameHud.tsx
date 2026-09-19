'use client';

import { comboMultiplier } from '@/domain/game/score';
import { cs } from '@/i18n/cs';

/**
 * Stav kola: série, body a životy.
 *
 * Kombo je vidět, jen když už něco znamená – jedna správná odpověď ještě
 * není série a blikat kvůli ní by byl hluk.
 */
export function GameHud({
  combo,
  points,
  lives,
}: {
  combo: number;
  points: number;
  lives: number | null;
}) {
  const multiplier = comboMultiplier(combo);
  const showCombo = combo >= 2;

  return (
    <div className="mx-auto mt-2 flex max-w-xl items-center gap-3 px-1">
      <div className="flex-1">
        {showCombo ? (
          <span
            key={combo}
            className="animate-pop-in inline-flex items-center gap-2 rounded-pill bg-gold/15 px-3 py-1 text-xs font-extrabold text-gold"
          >
            <span className="tabular-nums">{combo}×</span>
            <span className="text-gold/70">{cs.game.combo}</span>
            {multiplier > 1 ? (
              <span className="tabular-nums text-gold">·{multiplier}×</span>
            ) : null}
          </span>
        ) : null}
      </div>

      {lives !== null ? (
        <span className="flex items-center gap-1" aria-label={cs.game.lives}>
          {Array.from({ length: Math.max(lives, 0) }, (_, i) => (
            <span key={i} className="block size-2.5 rounded-full bg-coral" />
          ))}
        </span>
      ) : null}

      <span className="display text-sm tabular-nums text-mint">
        {points}
        <span className="ml-1 text-xs font-bold text-faint">{cs.game.pointsShort}</span>
      </span>
    </div>
  );
}
