'use client';

import { requireCountry } from '@/domain/countries';
import { cs } from '@/i18n/cs';
import { ROUTES } from '@/config/routes';
import { Button, ButtonLink, Eyebrow, Panel, ProgressRing } from '@/components/ui';
import { FlagImage } from '@/components/FlagImage';
import { Confetti } from '@/components/Confetti';

function encouragement(correct: number, total: number): string {
  if (total === 0) return cs.result.encouragement.keepGoing;
  const ratio = correct / total;
  if (ratio === 1) return cs.result.encouragement.perfect;
  if (ratio >= 0.8) return cs.result.encouragement.great;
  if (ratio >= 0.5) return cs.result.encouragement.good;
  return cs.result.encouragement.keepGoing;
}

export function ResultScreen({
  correct,
  total,
  goldEarned,
  onAgain,
}: {
  correct: number;
  total: number;
  goldEarned: string[];
  onAgain: () => void;
}) {
  return (
    <div className="stagger flex flex-col gap-4 py-8">
      {goldEarned.length > 0 ? <Confetti seed={goldEarned.length} /> : null}

      <Panel raised className="flex items-center gap-5">
        <ProgressRing value={correct} total={total} size={104}>
          <span className="display text-3xl leading-none tabular-nums">{correct}</span>
          <span className="text-xs font-bold tabular-nums text-faint">z {total}</span>
        </ProgressRing>
        <div className="min-w-0">
          <h1 className="display text-3xl">{cs.result.title}</h1>
          <p className="mt-1 text-sm leading-snug text-muted">{encouragement(correct, total)}</p>
        </div>
      </Panel>

      {goldEarned.length > 0 ? (
        <Panel className="border-gold/35">
          <Eyebrow>{cs.result.newGold(goldEarned.length)}</Eyebrow>
          <div className="mt-3 flex flex-wrap items-end justify-center gap-4">
            {goldEarned.map((code) => (
              <span key={code} className="flex w-20 flex-col items-center gap-2">
                <FlagImage code={code} size="md" glow pulse />
                <span className="text-center text-[0.7rem] font-bold leading-tight text-gold">
                  {requireCountry(code).nameCs}
                </span>
              </span>
            ))}
          </div>
        </Panel>
      ) : null}

      <div className="flex flex-col gap-2.5">
        <Button onClick={onAgain}>{cs.result.again}</Button>
        <ButtonLink href={ROUTES.album} variant="secondary">
          {cs.result.toAlbum}
        </ButtonLink>
        <ButtonLink href={ROUTES.home} variant="ghost">
          {cs.common.back}
        </ButtonLink>
      </div>
    </div>
  );
}
