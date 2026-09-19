'use client';

import { useEffect, useRef } from 'react';
import { useGameFeedback } from '@/components/useGameFeedback';
import { requireCountry } from '@/domain/countries';
import { cs } from '@/i18n/cs';
import { FlagImage } from '@/components/FlagImage';
import { Button, Eyebrow } from '@/components/ui';
import { MasteryBadge } from '@/components/MasteryBadge';
import type { Feedback } from '@/quiz/useQuizSession';

/**
 * Po každé odpovědi: velká správná vlajka a zajímavost.
 * Po chybě žádné kárání – jen ukázat, jak to je, a jít dál.
 */
export function FeedbackPanel({ feedback, onNext }: { feedback: Feedback; onNext: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const play = useGameFeedback();
  const country = requireCountry(feedback.outcome.card.code);
  const { correct, result } = feedback;

  // Na mobilu je panel pod nabídkou – ať ho dítě nemusí hledat.
  useEffect(() => {
    panel.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => {
    play(feedback.correct ? (feedback.speed === 'flash' ? 'combo' : 'correct') : 'wrong');
    // Zvuk patří k jedné odpovědi, ne ke každému překreslení.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = correct
    ? result.verdict === 'typo'
      ? cs.quiz.almost
      : cs.quiz.correct
    : cs.quiz.wrong;

  // U tlačítek je špatná volba zvýrazněná, psaný název se musí ukázat.
  const wroteOtherCountry =
    feedback.typed && result.verdict === 'wrongCountry' && result.matchedCode
      ? requireCountry(result.matchedCode)
      : null;

  return (
    <div
      ref={panel}
      className={`glass-raised animate-rise-in mt-6 flex flex-col gap-4 rounded-glass p-5 ${
        correct ? 'border-mint/35' : 'border-coral/35'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`display text-2xl ${correct ? 'text-mint' : 'text-coral'}`}>{title}</p>
          {feedback.gained !== 0 ? (
            <p
              className={`display animate-pop-in text-sm tabular-nums ${
                feedback.gained > 0 ? 'text-gold' : 'text-coral/80'
              }`}
            >
              {feedback.gained > 0 ? '+' : ''}
              {feedback.gained} {cs.game.pointsShort}
              {correct && cs.game.speed[feedback.speed] ? (
                <span className="ml-2 text-mint">{cs.game.speed[feedback.speed]}</span>
              ) : null}
            </p>
          ) : null}
        </div>
        <MasteryBadge
          mastery={feedback.outcome.after}
          label={cs.album.mastery[feedback.outcome.after]}
        />
      </div>

      {!correct ? (
        <div className="flex flex-col items-center gap-3 rounded-glass bg-white/5 p-4">
          <Eyebrow>{cs.quiz.correctAnswerIs}</Eyebrow>
          <FlagImage code={country.code} size="xl" priority pulse />
          <span className="display text-xl">{country.nameCs}</span>
          {wroteOtherCountry ? (
            <span className="text-center text-sm text-faint">
              {cs.quiz.youWrote(wroteOtherCountry.nameCs)}
            </span>
          ) : null}
        </div>
      ) : null}

      {country.funFact ? (
        <div className="glass-thin rounded-glass p-4">
          <Eyebrow>{cs.album.funFactTitle}</Eyebrow>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink/90">{country.funFact}</p>
        </div>
      ) : null}

      <Button onClick={onNext} autoFocus>
        {cs.common.next}
      </Button>
    </div>
  );
}
