'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flagUrl, requireCountry } from '@/domain/countries';
import type { Continent } from '@/domain/types';
import {
  SORT_PERFECT_BONUS,
  SORT_ROUND,
  gradeBatch,
  isBatchComplete,
  toBatches,
  SORT_ZONES,
  type Assignment,
  type SortResult,
} from '@/domain/quiz/sorting';
import { buildSession } from '@/domain/quiz/session';
import { isDue } from '@/domain/srs/scheduler';
import { pointsFor, type RoundTally } from '@/domain/game/score';
import { createRng } from '@/domain/rng';
import { cs } from '@/i18n/cs';
import { useActivePool } from '@/quiz/useActivePool';
import { useProgress, type RoundOutcome } from '@/store/StoreProvider';
import { useGameFeedback } from '@/components/useGameFeedback';
import { ContinentMap } from '@/components/map/ContinentMap';
import { FlagImage } from '@/components/FlagImage';
import { QuizShell } from '@/components/quiz/QuizShell';
import { ResultScreen } from '@/components/quiz/ResultScreen';
import { Button, Eyebrow } from '@/components/ui';

/** Kolik pixelů posunu ještě znamená „klepnutí“, ne „tažení“. */
const TAP_SLOP = 8;

const EMPTY_TALLY: RoundTally = {
  points: 0,
  correct: 0,
  total: 0,
  bestCombo: 0,
  flashCount: 0,
  elapsedMs: 0,
};

/**
 * Roztřiď: pět vlajek najednou na světadíly.
 *
 * Proti ostatním režimům se neodpovídá po jedné otázce – rozdělí se celá
 * sada a teprve pak se ukážou názvy zemí. Dokud se třídí, jsou na obrazovce
 * jen vlajky, takže se nedá jet po jménech a musí se poznat vlajka.
 *
 * Ovládat to jde dvěma způsoby schválně: tažením prstem i klepnutím na
 * vlajku a pak na světadíl. Tažení je zábavnější, klepání spolehlivější –
 * a na malé Evropě je rozdíl znát.
 */
export function SortScreen({
  codes,
  offTheRecord,
  onFinish,
}: {
  /** Předepsané vlajky (turnaj). Bez nich si je režim vybere sám. */
  codes?: readonly string[];
  offTheRecord?: boolean;
  onFinish?: (tally: RoundTally) => void;
}) {
  const { ready, progress, recordAnswer, finishRound } = useProgress();
  // Roztřiď schválně ignoruje vybranou část světa: kdyby se hrála jen
  // Evropa, byly by všechny vlajky z jednoho světadílu a nebylo by co třídit.
  const { set } = useActivePool();
  const play = useGameFeedback();

  const [nonce, setNonce] = useState(0);
  const [batchIndex, setBatchIndex] = useState(0);
  const [assignment, setAssignment] = useState<Assignment>({});
  const [results, setResults] = useState<SortResult[] | null>(null);
  const [perfect, setPerfect] = useState(false);
  const [tally, setTally] = useState<RoundTally>(EMPTY_TALLY);
  const [outcome, setOutcome] = useState<RoundOutcome | null>(null);
  const [done, setDone] = useState(false);

  const combo = useRef(0);
  const roundStart = useRef(Date.now());
  const batchStart = useRef(Date.now());
  const settled = useRef(false);

  // --- sady ---------------------------------------------------------------
  const batches = useMemo(() => {
    if (!ready) return [];
    if (codes) return toBatches(codes);
    return toBatches(
      buildSession({
        mode: 'sort',
        pool: set,
        cards: progress.cards,
        now: new Date(),
        rng: createRng(Date.now() ^ nonce),
        length: SORT_ROUND,
      }),
    );
    // Sada se losuje jednou na kolo; na každou odpověď se nepřepočítává.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, codes?.join(','), nonce, progress.meta.activeSet]);

  const batch = useMemo(() => batches[batchIndex] ?? [], [batches, batchIndex]);
  // Zón je vždycky šest – viz SORT_ZONES.
  const zones = SORT_ZONES;

  // --- braní vlajek do ruky ----------------------------------------------
  const [held, setHeld] = useState<string | null>(null);
  const [dragAt, setDragAt] = useState<{ x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState<Continent | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  const mapBox = useRef<HTMLDivElement>(null);
  const zoneCenters = useRef(new Map<Continent, SVGCircleElement>());

  /**
   * Který světadíl je pod prstem.
   *
   * Rozhoduje vzdálenost k jeho středu, ne trefa do kolečka: na telefonu
   * má mapa třetinovou šířku a přesné terče by byly pod 30 px. Takhle se
   * počítá nejbližší světadíl v rozumném okolí a prst nemusí být přesný.
   */
  const zoneAt = useCallback((x: number, y: number): Continent | null => {
    const map = mapBox.current?.getBoundingClientRect();
    if (!map) return null;
    if (x < map.left || x > map.right || y < map.top || y > map.bottom) return null;

    let best: Continent | null = null;
    let bestDistance = Infinity;
    for (const [continent, element] of zoneCenters.current) {
      const rect = element.getBoundingClientRect();
      const distance = Math.hypot(
        x - (rect.left + rect.width / 2),
        y - (rect.top + rect.height / 2),
      );
      if (distance < bestDistance) {
        bestDistance = distance;
        best = continent;
      }
    }
    // Uprostřed oceánu daleko od všeho se vlajka nepustí.
    return bestDistance <= map.width * 0.28 ? best : null;
  }, []);

  const assign = useCallback(
    (code: string, continent: Continent) => {
      setAssignment((current) => ({ ...current, [code]: continent }));
      setHeld(null);
      setDragAt(null);
      setHovered(null);
      play('correct');
    },
    [play],
  );

  const onFlagDown = (code: string) => (event: React.PointerEvent) => {
    if (results) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = { x: event.clientX, y: event.clientY };
    setHeld(code);
    setDragAt({ x: event.clientX, y: event.clientY });
  };

  const onFlagMove = (event: React.PointerEvent) => {
    if (!held || !start.current) return;
    setDragAt({ x: event.clientX, y: event.clientY });
    setHovered(zoneAt(event.clientX, event.clientY));
  };

  const onFlagUp = (event: React.PointerEvent) => {
    if (!held || !start.current) return;
    const moved =
      Math.abs(event.clientX - start.current.x) + Math.abs(event.clientY - start.current.y);
    const zone = zoneAt(event.clientX, event.clientY);
    start.current = null;
    setDragAt(null);
    setHovered(null);

    if (zone) {
      assign(held, zone);
      return;
    }
    // Krátké klepnutí nechá vlajku „v ruce“ – pak stačí klepnout na světadíl.
    if (moved > TAP_SLOP) setHeld(null);
  };

  /** Klepnutí do mapy, když je vlajka v ruce. */
  const onMapTap = (event: React.PointerEvent) => {
    if (!held || dragAt) return;
    const zone = zoneAt(event.clientX, event.clientY);
    if (zone) assign(held, zone);
  };

  // --- vyhodnocení sady ---------------------------------------------------
  const check = async () => {
    const graded = gradeBatch(batch, assignment, (code) => requireCountry(code).continent);
    const perSecond = Math.max(1, Math.round((Date.now() - batchStart.current) / batch.length));

    let gained = 0;
    let correct = 0;
    let best = tally.bestCombo;

    for (const result of graded) {
      const card = progress.cards[result.code];
      const due = card ? isDue(card, new Date()) : false;
      if (result.ok) {
        combo.current += 1;
        best = Math.max(best, combo.current);
        correct += 1;
        gained += pointsFor({
          correct: true,
          elapsedMs: perSecond,
          combo: combo.current,
          isDue: due,
          difficulty: requireCountry(result.code).difficulty,
          stake: 1,
        });
      } else {
        combo.current = 0;
      }

      await recordAnswer(result.code, {
        correct: result.ok,
        elapsedMs: perSecond,
        mode: 'sort',
        // Vlajka je v otázce vidět a ptáme se na zeměpis – karta se nehýbe.
        skipsScheduler: true,
        offTheRecord: offTheRecord ?? false,
      });
    }

    const allRight = graded.every((result) => result.ok);
    if (allRight) gained += SORT_PERFECT_BONUS;

    setPerfect(allRight);
    setResults(graded);
    setTally((current) => ({
      ...current,
      points: current.points + gained,
      correct: current.correct + correct,
      total: current.total + graded.length,
      bestCombo: best,
    }));
    play(allRight ? 'record' : correct > 0 ? 'correct' : 'wrong');
  };

  const nextBatch = () => {
    setResults(null);
    setPerfect(false);
    setAssignment({});
    batchStart.current = Date.now();
    if (batchIndex + 1 >= batches.length) setDone(true);
    else setBatchIndex((i) => i + 1);
  };

  // Uzavření kola: rekord a body jen v osobní hře.
  useEffect(() => {
    if (!done || settled.current) return;
    settled.current = true;
    const final = { ...tally, elapsedMs: Date.now() - roundStart.current };
    setTally(final);
    if (onFinish) {
      onFinish(final);
      return;
    }
    if (offTheRecord) return;
    // Rekord je jeden pro celou sadu – část světa se tu neuplatňuje.
    void finishRound('sort', final).then(setOutcome);
  }, [done, tally, onFinish, offTheRecord, finishRound]);

  const restart = () => {
    settled.current = false;
    combo.current = 0;
    roundStart.current = Date.now();
    batchStart.current = Date.now();
    setNonce((n) => n + 1);
    setBatchIndex(0);
    setAssignment({});
    setResults(null);
    setPerfect(false);
    setTally(EMPTY_TALLY);
    setOutcome(null);
    setDone(false);
  };

  if (!ready || batches.length === 0) {
    return (
      <div className="flex min-h-[var(--safe-height)] items-center justify-center text-sm font-bold text-faint">
        {cs.common.loading}
      </div>
    );
  }

  if (done) {
    if (onFinish) {
      return (
        <div className="flex min-h-[var(--safe-height)] items-center justify-center text-sm font-bold text-faint">
          {cs.common.loading}
        </div>
      );
    }
    return (
      <div className="mx-auto flex min-h-[var(--safe-height)] w-full max-w-xl flex-col justify-center px-4 py-6">
        <ResultScreen
          mode="sort"
          tally={tally}
          outcome={outcome}
          goldEarned={[]}
          missed={results?.filter((r) => !r.ok).map((r) => r.code) ?? []}
          onAgain={restart}
        />
      </div>
    );
  }

  const waiting = batch.filter((code) => assignment[code] == null);
  const complete = isBatchComplete(batch, assignment);

  return (
    <QuizShell
      index={batchIndex}
      total={batches.length}
      combo={combo.current}
      points={tally.points}
      lives={null}
    >
      <div className="flex flex-1 flex-col gap-3 py-2">
        <div className="text-center">
          <Eyebrow>{cs.sort.batch(batchIndex + 1, batches.length)}</Eyebrow>
          <h1 className="display mt-0.5 text-xl text-muted">
            {results ? cs.sort.resultTitle : held ? cs.sort.picked : cs.sort.prompt}
          </h1>
        </div>

        <div ref={mapBox} onPointerUp={onMapTap} className="glass-thin rounded-glass p-1.5">
          <ContinentMap
            zones={zones}
            active={hovered}
            reveal={results !== null}
            zoneRef={(continent, element) => {
              if (element) zoneCenters.current.set(continent, element);
              else zoneCenters.current.delete(continent);
            }}
          >
            {(continent, x, y) => (
              <PinnedFlags
                continent={continent}
                x={x}
                y={y}
                batch={batch}
                assignment={assignment}
                results={results}
              />
            )}
          </ContinentMap>
        </div>

        {/* --- zásobník vlajek k roztřídění --- */}
        {!results ? (
          <div className="flex flex-col gap-2">
            <div className="flex min-h-24 flex-wrap items-center justify-center gap-2.5">
              {waiting.map((code) => (
                <button
                  key={code}
                  type="button"
                  onPointerDown={onFlagDown(code)}
                  onPointerMove={onFlagMove}
                  onPointerUp={onFlagUp}
                  className={`touch-none rounded-2xl p-1.5 transition-transform duration-150 ${
                    held === code
                      ? 'scale-110 bg-mint/20 ring-2 ring-mint'
                      : 'glass-thin active:scale-105'
                  }`}
                >
                  <FlagImage code={code} size="md" priority glow={false} />
                </button>
              ))}
            </div>
            {/* Dokud sada není hotová, nesvítí tlačítko – jen počítadlo.
                Zelené tlačítko, na které nejde klepnout, jen mate. */}
            {complete ? (
              <Button onClick={() => void check()}>{cs.sort.check}</Button>
            ) : (
              <>
                <p className="display text-center text-base text-muted">
                  {cs.sort.remaining(waiting.length)}
                </p>
                <p className="text-center text-[0.78rem] leading-snug text-faint">
                  {cs.sort.hint}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {perfect ? (
              <p className="display text-center text-xl text-gold">
                {cs.sort.perfect}{' '}
                <span className="text-sm">{cs.sort.perfectBonus(SORT_PERFECT_BONUS)}</span>
              </p>
            ) : null}
            <ul className="flex flex-col gap-1.5">
              {results.map((result) => (
                <li
                  key={result.code}
                  className={`glass-thin flex items-center gap-3 rounded-2xl px-3 py-2 ${
                    result.ok ? 'border-mint/40' : 'border-coral/40'
                  }`}
                >
                  <FlagImage code={result.code} size="xs" glow={false} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.85rem] font-bold leading-tight">
                      {requireCountry(result.code).nameCs}
                    </span>
                    {!result.ok ? (
                      <span className="block text-[0.72rem] leading-snug text-faint">
                        {cs.sort.belongsTo(cs.continentsGenitive[result.correct])}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={`display shrink-0 text-lg ${
                      result.ok ? 'text-mint' : 'text-coral'
                    }`}
                  >
                    {result.ok ? '✓' : '✕'}
                  </span>
                </li>
              ))}
            </ul>
            <Button onClick={nextBatch}>
              {batchIndex + 1 >= batches.length ? cs.sort.finishRound : cs.sort.nextBatch}
            </Button>
          </div>
        )}
      </div>

      {/* Vlajka pod prstem. Nesmí clonit, jinak by ji `elementFromPoint` viděl
          místo mapy. */}
      {held && dragAt ? (
        <span
          aria-hidden="true"
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 drop-shadow-2xl"
          style={{ left: dragAt.x, top: dragAt.y }}
        >
          <FlagImage code={held} size="md" priority glow />
        </span>
      ) : null}
    </QuizShell>
  );
}

/** Vlajky připnuté k jednomu světadílu – kreslí se rovnou do mapy. */
function PinnedFlags({
  continent,
  x,
  y,
  batch,
  assignment,
  results,
}: {
  continent: Continent;
  x: number;
  y: number;
  batch: readonly string[];
  assignment: Assignment;
  results: SortResult[] | null;
}) {
  const here = batch.filter((code) => assignment[code] === continent);
  if (here.length === 0) return null;

  const width = 26;
  const gap = 3;
  const total = here.length * width + (here.length - 1) * gap;

  return (
    <g transform={`translate(${x - total / 2}, ${y + 12})`}>
      {here.map((code, i) => {
        const result = results?.find((item) => item.code === code);
        return (
          <g key={code} transform={`translate(${i * (width + gap)}, 0)`}>
            <image href={flagUrl(code)} width={width} height={width * 0.66} />
            <rect
              width={width}
              height={width * 0.66}
              fill="none"
              stroke={
                result ? (result.ok ? 'var(--color-mint)' : 'var(--color-coral)') : 'rgb(255 255 255 / 0.6)'
              }
              strokeWidth={result ? 2.5 : 1}
            />
          </g>
        );
      })}
    </g>
  );
}
