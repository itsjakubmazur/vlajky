'use client';

import { standings, type PartyState } from '@/domain/game/party';
import { cs } from '@/i18n/cs';
import { Eyebrow } from '@/components/ui';

/** Tabulka turnaje: rozhodují vyhraná kola, až při shodě body. */
export function PartyStandings({ state }: { state: PartyState }) {
  const rows = standings(state);

  return (
    <div>
      <Eyebrow>{cs.party.standings}</Eyebrow>
      <ol className="mt-3 flex flex-col gap-1.5">
        {rows.map((row, i) => (
          <li
            key={row.player.id}
            className={`glass-thin flex items-center gap-3 rounded-2xl px-3.5 py-2.5 ${
              i === 0 && row.wins > 0 ? 'border-gold/40' : ''
            }`}
          >
            <span
              className={`display w-6 shrink-0 text-center text-sm tabular-nums ${
                i === 0 && row.wins > 0 ? 'text-gold' : 'text-faint'
              }`}
            >
              {i + 1}
            </span>
            <span className="display min-w-0 flex-1 truncate text-base">{row.player.name}</span>
            <span className="shrink-0 text-right">
              <span
                className={`block text-[0.8rem] font-extrabold ${
                  row.wins > 0 ? 'text-gold' : 'text-faint'
                }`}
              >
                {row.wins > 0 ? cs.party.wins(row.wins) : cs.party.noWins}
              </span>
              <span className="block text-[0.7rem] font-bold tabular-nums text-faint">
                {row.points} {cs.game.pointsShort}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
