'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import {
  createParty,
  currentRound,
  isRoundComplete,
  playerOnTurn,
  recordScore,
  roundsPlayed,
  startRound,
  type PartyPlayer,
  type PartyState,
} from '@/domain/game/party';
import { buildSession } from '@/domain/quiz/session';
import type { QuizModeId } from '@/domain/quiz/modes';
import type { RoundTally } from '@/domain/game/score';
import { createRng } from '@/domain/rng';
import { ROUTES } from '@/config/routes';
import { cs } from '@/i18n/cs';
import { useActivePool } from '@/quiz/useActivePool';
import { useProgress } from '@/store/StoreProvider';
import { QuizScreen } from '@/components/quiz/QuizScreen';
import { Button, ButtonLink, Eyebrow, Panel } from '@/components/ui';
import { PartySetup } from './PartySetup';
import { PartyRoundResult } from './PartyRound';
import { PartyStandings } from './PartyStandings';

/**
 * Turnaj u jednoho zařízení.
 *
 * Stav turnaje žije v úložišti, ne jen v paměti obrazovky – na dovolené se
 * tablet uspí nebo se omylem zavře karta a nikdo nechce přijít o odehraná
 * kola. Z téhož důvodu se předávání zařízení řeší mezikrokem: kdyby hra
 * naskočila hned, další hráč by viděl konec toho předchozího.
 */
export function PartyScreen() {
  const { ready, progress, setMeta } = useProgress();
  const { pool } = useActivePool();
  const party = progress.meta.party;

  // `handoff` = čeká se, až si zařízení převezme hráč na řadě.
  const [playing, setPlaying] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const save = useCallback((next: PartyState | null) => void setMeta({ party: next }), [setMeta]);

  /**
   * Vlajky do kola. Losují se jednou a pak je dostanou všichni hráči –
   * proto se sestavují tady, ne uvnitř hry. Karty se schválně ignorují:
   * výběr podle paměti majitele zařízení by ostatním nedával smysl.
   */
  const drawCodes = useCallback(
    (mode: QuizModeId, length: number) =>
      buildSession({
        mode,
        pool,
        cards: {},
        now: new Date(),
        rng: createRng(Date.now()),
        length,
      }).slice(0, length),
    [pool],
  );

  const begin = (players: PartyPlayer[], mode: QuizModeId, length: number) => {
    const fresh = startRound(createParty(players, mode, length), drawCodes(mode, length));
    save(fresh);
  };

  const onTurn = party ? playerOnTurn(party) : undefined;
  const round = party ? currentRound(party) : undefined;
  const played = party ? roundsPlayed(party) : 0;

  const finishTurn = useCallback(
    (tally: RoundTally) => {
      if (!party || !onTurn) return;
      setPlaying(false);
      save(
        recordScore(party, onTurn.id, {
          correct: tally.correct,
          total: tally.total,
          points: tally.points,
          bestCombo: tally.bestCombo,
          elapsedMs: tally.elapsedMs,
        }),
      );
    },
    [party, onTurn, save],
  );

  const nextRound = () => {
    if (!party) return;
    setPlaying(false);
    save(startRound(party, drawCodes(party.mode, party.length)));
  };

  const header = useMemo(
    () => (
      <header className="mb-5 flex items-center gap-4">
        <Link
          href={ROUTES.home}
          className="touch-target -ml-2 inline-flex items-center rounded-pill px-2 text-sm font-extrabold text-muted transition-colors hover:text-ink"
        >
          {cs.common.back}
        </Link>
        <h1 className="display text-3xl">{cs.party.title}</h1>
      </header>
    ),
    [],
  );

  if (!ready) {
    return (
      <div className="flex min-h-[var(--safe-height)] items-center justify-center text-sm font-bold text-faint">
        {cs.common.loading}
      </div>
    );
  }

  // --- hraje se -----------------------------------------------------------
  if (party && round && onTurn && playing) {
    return (
      <QuizScreen
        // Nový hráč = nová hra od začátku, i když je režim a kolo stejné.
        key={`${party.rounds.length}-${onTurn.id}`}
        mode={party.mode}
        codes={round.codes}
        offTheRecord
        onFinish={finishTurn}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-10 pt-8">
      {header}

      {/* --- nastavení nového turnaje --- */}
      {!party ? (
        <>
          <p className="mb-5 text-sm leading-snug text-muted">{cs.party.desc}</p>
          <PartySetup onStart={begin} />
        </>
      ) : null}

      {/* --- předání zařízení --- */}
      {party && onTurn ? (
        <div className="stagger flex flex-col gap-3">
          <Panel raised className="border-mint/30 text-center">
            <Eyebrow>{cs.party.roundLabel(party.rounds.length)}</Eyebrow>
            <p className="display mt-2 text-3xl">{cs.party.handoffWho(onTurn.name)}</p>
            <p className="mt-2 text-sm text-muted">{cs.party.handoffHint}</p>
            <Button className="mt-5 w-full" onClick={() => setPlaying(true)}>
              {cs.party.handoffStart}
            </Button>
          </Panel>

          {round && Object.keys(round.scores).length > 0 ? (
            <Panel>
              <PartyRoundResult state={party} />
            </Panel>
          ) : null}

          {played > 0 ? (
            <Panel>
              <PartyStandings state={party} />
            </Panel>
          ) : null}
        </div>
      ) : null}

      {/* --- kolo dohráno --- */}
      {party && !onTurn && isRoundComplete(party) ? (
        <div className="stagger flex flex-col gap-3">
          <Panel raised>
            <PartyRoundResult state={party} />
          </Panel>
          <Panel>
            <PartyStandings state={party} />
          </Panel>
          <Button onClick={nextRound}>{cs.party.nextRound}</Button>
        </div>
      ) : null}

      {/* --- ukončení --- */}
      {party ? (
        <div className="mt-6 flex flex-col gap-2.5">
          {confirmEnd ? (
            <Panel className="border-coral/40">
              <p className="text-sm font-bold text-coral">{cs.party.finishConfirm}</p>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <Button variant="secondary" onClick={() => setConfirmEnd(false)}>
                  {cs.common.cancel}
                </Button>
                <Button
                  onClick={() => {
                    setConfirmEnd(false);
                    save(null);
                  }}
                >
                  {cs.party.finish}
                </Button>
              </div>
            </Panel>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmEnd(true)}>
              {cs.party.finish}
            </Button>
          )}
          <p className="px-1 text-center text-[0.78rem] leading-snug text-faint">
            {cs.party.notCounted}
          </p>
        </div>
      ) : (
        <ButtonLink href={ROUTES.home} variant="ghost" className="mt-6 w-full">
          {cs.common.back}
        </ButtonLink>
      )}
    </div>
  );
}
