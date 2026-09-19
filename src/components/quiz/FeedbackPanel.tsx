'use client';

import { useEffect, useRef } from 'react';
import { requireCountry } from '@/domain/countries';
import { cs } from '@/i18n/cs';
import { FlagImage } from '@/components/FlagImage';
import { Button } from '@/components/ui';
import { MasteryBadge } from '@/components/MasteryBadge';
import type { Feedback } from '@/quiz/useQuizSession';

/**
 * Po každé odpovědi: velká vlajka, název a zajímavost.
 * Po chybě žádné kárání – jen ukázat, jak to je, a jít dál.
 */
export function FeedbackPanel({ feedback, onNext }: { feedback: Feedback; onNext: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const country = requireCountry(feedback.outcome.card.code);
  const { correct, result } = feedback;

  // Na mobilu je panel pod nabídkou – ať ho dítě nemusí hledat.
  useEffect(() => {
    panel.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  const title = correct
    ? result.verdict === 'typo'
      ? cs.quiz.almost
      : cs.quiz.correct
    : cs.quiz.wrong;

  // U tlačítek je špatná volba zvýrazněná červeně, psaný název se musí ukázat.
  const wroteOtherCountry =
    feedback.typed && result.verdict === 'wrongCountry' && result.matchedCode
      ? requireCountry(result.matchedCode)
      : null;

  return (
    <div
      ref={panel}
      className={`animate-rise mt-auto flex flex-col gap-4 rounded-xl2 border-2 p-4 ${
        correct ? 'border-correct/40 bg-correct-soft' : 'border-wrong/30 bg-wrong-soft'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className={`text-xl font-extrabold ${correct ? 'text-correct' : 'text-wrong'}`}>{title}</p>
        <MasteryBadge
          mastery={feedback.outcome.after}
          label={cs.album.mastery[feedback.outcome.after]}
        />
      </div>

      {!correct ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface p-3">
          <span className="text-sm font-semibold text-muted">{cs.quiz.correctAnswerIs}</span>
          <FlagImage code={country.code} size="xl" />
          <span className="text-lg font-extrabold">{country.nameCs}</span>
          {wroteOtherCountry ? (
            <span className="text-center text-sm text-muted">
              {cs.quiz.youWrote(wroteOtherCountry.nameCs)}
            </span>
          ) : null}
        </div>
      ) : null}

      {country.funFact ? (
        <p className="rounded-2xl bg-surface/70 p-3 text-base leading-snug">
          <span className="font-bold">{cs.album.funFactTitle} </span>
          {country.funFact}
        </p>
      ) : null}

      <Button onClick={onNext} autoFocus>
        {cs.common.next}
      </Button>
    </div>
  );
}
