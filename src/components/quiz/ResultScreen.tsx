'use client';

import { requireCountry } from '@/domain/countries';
import { cs } from '@/i18n/cs';
import { ROUTES } from '@/config/routes';
import { Button, ButtonLink, Card } from '@/components/ui';
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
    <div className="animate-pop-in flex flex-col gap-5 py-6">
      {goldEarned.length > 0 ? <Confetti seed={goldEarned.length} /> : null}

      <div className="text-center">
        <h1 className="text-3xl font-extrabold">{cs.result.title}</h1>
        <p className="mt-1 text-lg font-semibold text-brand">{cs.result.score(correct, total)}</p>
        <p className="mt-2 text-muted">{encouragement(correct, total)}</p>
      </div>

      {goldEarned.length > 0 ? (
        <Card className="border-gold/40 bg-gold/10">
          <p className="mb-3 text-center font-bold text-gold">
            {cs.result.newGold(goldEarned.length)}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {goldEarned.map((code) => (
              <span key={code} className="flex flex-col items-center gap-1">
                <FlagImage code={code} size="md" />
                <span className="text-xs font-semibold">{requireCountry(code).nameCs}</span>
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3">
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
