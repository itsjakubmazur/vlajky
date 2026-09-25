'use client';

import { useEffect, useMemo, useState } from 'react';
import { requireCountry } from '@/domain/countries';
import { FLASH_MS, RACE_MODES, type QuizModeId } from '@/domain/quiz/modes';
import type { RoundTally } from '@/domain/game/score';
import { cs } from '@/i18n/cs';
import { useQuizSession } from '@/quiz/useQuizSession';
import { useQuizKeyboard } from '@/quiz/useQuizKeyboard';
import { useActivePool } from '@/quiz/useActivePool';
import { useProgress } from '@/store/StoreProvider';
import { FlagImage } from '@/components/FlagImage';
import { QuizShell } from './QuizShell';
import { OptionGrid } from './OptionGrid';
import { TwinsQuestion } from './TwinsQuestion';
import { TypingInput } from './TypingInput';
import { MapQuestion } from './MapQuestion';
import { StakePicker } from './StakePicker';
import { FeedbackPanel } from './FeedbackPanel';
import { ResultScreen } from './ResultScreen';
import { SortScreen } from '@/components/sort/SortScreen';

export interface QuizScreenProps {
  mode: QuizModeId;
  bossId?: string;
  /** Předepsané vlajky – v turnaji dostanou všichni hráči stejné otázky. */
  codes?: readonly string[];
  /** Hra se nepočítá do postupu majitele zařízení. */
  offTheRecord?: boolean;
  /** Když je zadané, výsledek si převezme volající a obrazovka výsledku se neukáže. */
  onFinish?: (tally: RoundTally) => void;
}

/**
 * Rozcestník mezi hrami.
 *
 * Roztřiď se neptá po jedné otázce, ale rozděluje celou sadu – má proto
 * vlastní obrazovku. Díky tomu, že se rozhoduje tady, funguje v turnaji
 * úplně stejně jako ostatní režimy a turnaj o něm nemusí nic vědět.
 */
export function QuizScreen(props: QuizScreenProps) {
  if (props.mode === 'sort') {
    return (
      <SortScreen
        codes={props.codes}
        offTheRecord={props.offTheRecord}
        onFinish={props.onFinish}
      />
    );
  }
  return <QuizRunner {...props} />;
}

function QuizRunner({ mode, bossId, codes, offTheRecord, onFinish }: QuizScreenProps) {
  const session = useQuizSession(mode, { bossId, codes, offTheRecord });
  const { progress } = useProgress();
  const autoNext = progress.meta.autoNext;
  const { set, pool: regionPool } = useActivePool();
  // Denní výzva a souboje jedou přes celou sadu, viz useActivePool.
  const pool = mode === 'daily' || mode === 'boss' ? set : regionPool;

  // Mapa se ořízne na to, co se zrovna hraje. Při vybrané Evropě nemá smysl
  // ukazovat celý svět a tři špendlíky namačkané na dva centimetry.
  const frameCodes = useMemo(() => pool.map((country) => country.code), [pool]);

  // Režim Blesk: vlajka po dvou sekundách zmizí a odpovídá se po paměti.
  const [flashHidden, setFlashHidden] = useState(false);
  useEffect(() => {
    if (mode !== 'flash') return;
    setFlashHidden(false);
    const timer = setTimeout(() => setFlashHidden(true), FLASH_MS);
    return () => clearTimeout(timer);
  }, [mode, session.index]);

  // Vabank: sází se naslepo. Vlajka se odhalí teprve po sázce – jinak by
  // dítě vsadilo tři jen tam, kde odpověď zná, a nešlo by o žádné riziko.
  const [staked, setStaked] = useState(false);
  useEffect(() => setStaked(false), [session.index, mode]);

  // Klávesnice: 1–4 vyberou odpověď, Enter posune dál. Hák musí být
  // nad všemi návraty, jinak by se pořadí háků mezi překresleními lišilo.
  const keyboardOptions = session.question?.options ?? [];
  useQuizKeyboard({
    options: keyboardOptions,
    onChoose: session.answerWithCode,
    onNext: session.feedback ? session.next : null,
    enabled: session.phase === 'question' || session.phase === 'feedback',
  });

  // Turnaj si výsledek kola převezme sám – ResultScreen by ukazoval rekordy
  // a hodnost majitele zařízení, což s cizím hráčem nemá co dělat.
  const finished = session.phase === 'done';
  useEffect(() => {
    if (finished && onFinish) onFinish(session.tally);
    // Kolo se uzavírá jednou; `tally` se po dohrání už nemění.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (session.phase === 'loading') {
    return (
      <div className="flex min-h-[var(--safe-height)] items-center justify-center text-sm font-bold text-faint">
        {cs.common.loading}
      </div>
    );
  }

  if (session.phase === 'done') {
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
          mode={mode}
          tally={session.tally}
          outcome={session.roundOutcome}
          goldEarned={session.goldEarned}
          missed={session.missed}
          onAgain={session.restart}
        />
      </div>
    );
  }

  const question = session.question!;
  const target = requireCountry(question.code);
  const chosen = session.feedback
    ? question.kind === 'type'
      ? question.code
      : (session.feedback.given ?? question.code)
    : null;

  const prompt =
    question.kind === 'pickFlag'
      ? cs.quiz.whichFlag(target.nameCs)
      : question.kind === 'twins'
        ? cs.quiz.whichIs(target.nameCs)
        : question.kind === 'type'
          ? cs.quiz.typeCountry
          : question.kind === 'pickOnMap'
            ? cs.quiz.whereIsIt
            : question.kind === 'pickCapital'
              ? cs.quiz.whichCapital
              : question.kind === 'pickByCapital'
                ? cs.quiz.whichFlagByCapital(target.capitalCs)
                : cs.quiz.whichCountry;

  const showsFlagInQuestion =
    question.kind === 'pickCountry' ||
    question.kind === 'type' ||
    question.kind === 'pickCapital' ||
    question.kind === 'pickOnMap';
  const awaitingStake = mode === 'risk' && !staked && !session.feedback;
  const flagVisible =
    !(mode === 'flash' && flashHidden && !session.feedback) && !awaitingStake;

  return (
    <QuizShell
      index={session.index}
      total={session.total}
      combo={session.combo}
      points={session.points}
      lives={session.lives}
    >
      <div
        className={`flex flex-1 flex-col ${showsFlagInQuestion ? '' : 'justify-center gap-6 py-4'}`}
      >
        {showsFlagInQuestion ? (
          <div className="flex flex-1 flex-col justify-center gap-6 py-4">
            <h1 className="display text-center text-xl text-muted">{prompt}</h1>
            <div key={question.code} className="animate-flag-reveal flex justify-center">
              {flagVisible ? (
                <FlagImage code={question.code} size="xl" priority />
              ) : (
                // Prázdné místo si drží velikost, ať obraz neposkočí.
                <span className="glass-thin flex h-[150px] w-[225px] items-center justify-center rounded-glass text-4xl font-black text-faint">
                  ?
                </span>
              )}
            </div>
          </div>
        ) : (
          <h1 className="display text-center text-xl text-muted">{prompt}</h1>
        )}

        <div key={`odpovedi-${session.index}`} className="flex flex-col gap-4">
          {awaitingStake ? (
            <StakePicker
              value={session.stake}
              onChange={(value) => {
                session.setStake(value);
                setStaked(true);
              }}
            />
          ) : null}

          {!awaitingStake &&
          (question.kind === 'pickCountry' ||
            question.kind === 'pickFlag' ||
            question.kind === 'pickCapital' ||
            question.kind === 'pickByCapital') ? (
            <OptionGrid
              options={question.options}
              asFlags={question.kind === 'pickFlag' || question.kind === 'pickByCapital'}
              label={question.kind === 'pickCapital' ? 'capital' : 'name'}
              correctCode={question.code}
              chosen={chosen}
              onChoose={session.answerWithCode}
            />
          ) : null}

          {!awaitingStake && question.kind === 'pickOnMap' ? (
            <MapQuestion
              options={question.options}
              correctCode={question.code}
              chosen={chosen}
              onChoose={session.answerWithCode}
              frameCodes={frameCodes}
            />
          ) : null}

          {!awaitingStake && question.kind === 'twins' ? (
            <TwinsQuestion
              options={question.options}
              correctCode={question.code}
              chosen={chosen}
              onChoose={session.answerWithCode}
            />
          ) : null}

          {!awaitingStake && question.kind === 'type' ? (
            <TypingInput
              pool={pool}
              disabled={session.phase === 'feedback'}
              hint={session.hint}
              onSubmit={session.answerWithText}
              onSkip={session.skip}
            />
          ) : null}

          {session.feedback ? (
            <FeedbackPanel
              feedback={session.feedback}
              onNext={session.next}
              autoNext={autoNext && RACE_MODES.includes(mode)}
            />
          ) : null}
        </div>
      </div>
    </QuizShell>
  );
}
