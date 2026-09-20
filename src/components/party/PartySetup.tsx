'use client';

import { useState } from 'react';
import {
  PARTY_DEFAULT_LENGTH,
  PARTY_LENGTHS,
  PARTY_MAX_PLAYERS,
  PARTY_MIN_PLAYERS,
  PARTY_MODES,
  type PartyPlayer,
} from '@/domain/game/party';
import type { QuizModeId } from '@/domain/quiz/modes';
import { cs } from '@/i18n/cs';
import { Button, Eyebrow, Panel } from '@/components/ui';

const COUNTS = Array.from(
  { length: PARTY_MAX_PLAYERS - PARTY_MIN_PLAYERS + 1 },
  (_, i) => PARTY_MIN_PLAYERS + i,
);

/** Nastavení turnaje: kdo hraje, co se hraje a jak dlouho jedno kolo trvá. */
export function PartySetup({
  onStart,
}: {
  onStart: (players: PartyPlayer[], mode: QuizModeId, length: number) => void;
}) {
  const [count, setCount] = useState(2);
  const [names, setNames] = useState<string[]>([]);
  const [mode, setMode] = useState<QuizModeId>('classic');
  const [length, setLength] = useState<number>(PARTY_DEFAULT_LENGTH);

  const nameAt = (i: number) => names[i] ?? '';

  const start = () => {
    const players: PartyPlayer[] = Array.from({ length: count }, (_, i) => ({
      id: `p${i + 1}`,
      name: nameAt(i).trim() || cs.party.playerName(i + 1),
    }));
    onStart(players, mode, length);
  };

  return (
    <div className="stagger flex flex-col gap-3">
      <Panel raised>
        <Eyebrow>{cs.party.playerCount}</Eyebrow>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {COUNTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCount(value)}
              className={`touch-target min-w-14 rounded-pill px-4 text-sm font-extrabold transition-colors ${
                count === value ? 'bg-mint text-abyss' : 'glass-thin text-muted hover:text-ink'
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <Eyebrow>{cs.party.playersTitle}</Eyebrow>
          <div className="mt-2.5 flex flex-col gap-2">
            {Array.from({ length: count }, (_, i) => (
              <input
                key={i}
                value={nameAt(i)}
                onChange={(event) => {
                  const next = [...names];
                  next[i] = event.target.value;
                  setNames(next);
                }}
                placeholder={cs.party.playerName(i + 1)}
                aria-label={cs.party.playerName(i + 1)}
                maxLength={16}
                className="glass-thin touch-target w-full rounded-pill px-5 text-ink placeholder:text-faint"
              />
            ))}
          </div>
        </div>
      </Panel>

      <Panel>
        <Eyebrow>{cs.party.modeTitle}</Eyebrow>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {PARTY_MODES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`rounded-pill px-4 py-2.5 text-[0.8rem] font-extrabold transition-colors ${
                mode === value ? 'bg-ink text-abyss' : 'glass-thin text-muted hover:text-ink'
              }`}
            >
              {cs.modes[value as keyof typeof cs.modes].name}
            </button>
          ))}
        </div>
      </Panel>

      <Panel>
        <Eyebrow>{cs.party.lengthTitle}</Eyebrow>
        <div className="mt-2.5 flex gap-2">
          {PARTY_LENGTHS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setLength(value)}
              className={`touch-target flex-1 rounded-pill text-sm font-extrabold transition-colors ${
                length === value ? 'bg-ink text-abyss' : 'glass-thin text-muted hover:text-ink'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </Panel>

      <p className="px-1 text-[0.78rem] leading-snug text-faint">{cs.party.notCounted}</p>
      <Button onClick={start}>{cs.party.start}</Button>
    </div>
  );
}
