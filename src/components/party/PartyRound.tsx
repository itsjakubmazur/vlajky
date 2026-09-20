'use client';

import { currentRound, roundWinners, type PartyState } from '@/domain/game/party';
import { cs } from '@/i18n/cs';
import { Eyebrow } from '@/components/ui';

/** Výsledek právě dohraného kola – kdo kolik nasbíral a kdo vyhrál. */
export function PartyRoundResult({ state }: { state: PartyState }) {
  const round = currentRound(state);
  if (!round) return null;

  const winners = roundWinners(round);
  const rows = state.players
    .map((player) => ({ player, score: round.scores[player.id] }))
    .sort((a, b) => (b.score?.points ?? 0) - (a.score?.points ?? 0));

  const winnerNames = state.players
    .filter((player) => winners.includes(player.id))
    .map((player) => player.name);

  return (
    <div>
      <Eyebrow>{cs.party.roundResult}</Eyebrow>
      <p className="display mt-1 text-2xl text-gold">
        {winnerNames.length === 1 ? cs.party.winner(winnerNames[0]!) : cs.party.winnerTie}
      </p>
      <ul className="mt-4 flex flex-col gap-1.5">
        {rows.map(({ player, score }) => (
          <li
            key={player.id}
            className={`glass-thin flex items-center gap-3 rounded-2xl px-3.5 py-2.5 ${
              winners.includes(player.id) ? 'border-gold/40' : ''
            }`}
          >
            <span className="display min-w-0 flex-1 truncate text-base">{player.name}</span>
            {score ? (
              <>
                <span className="shrink-0 text-[0.75rem] font-bold tabular-nums text-faint">
                  {cs.result.score(score.correct, score.total)}
                </span>
                <span className="display w-16 shrink-0 text-right text-base tabular-nums text-mint">
                  {score.points}
                </span>
              </>
            ) : (
              <span className="shrink-0 text-[0.75rem] font-bold text-faint">
                {cs.party.waiting(player.name)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
