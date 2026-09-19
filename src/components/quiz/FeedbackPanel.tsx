'use client';

import { useEffect, useRef } from 'react';
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
        <p className={`display text-2xl ${correct ? 'text-mint' : 'text-coral'}`}>{title}</p>
        <MasteryBadge
          mastery={feedback.outcome.after}
          label={cs.album.mastery[feedback.outcome.after]}
        />
      </div>

      {!correct ? (
        <div className="flex flex-col items-center gap-3 rounded-glass bg-white/5 p-4">
          <Eyebrow>{cs.quiz.correctAnswerIs}</Eyebrow>
          <FlagImage code={country.code} size="xl" pulse />
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
