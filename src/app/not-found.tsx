import { cs } from '@/i18n/cs';
import { ROUTES } from '@/config/routes';
import { ButtonLink, Panel } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[var(--safe-height)] w-full max-w-xl flex-col justify-center px-4 py-6">
      <Panel raised className="flex flex-col gap-4">
        <div>
          <h1 className="display text-2xl">{cs.errors.notFoundTitle}</h1>
          <p className="mt-2 text-sm leading-snug text-muted">{cs.errors.notFoundDesc}</p>
        </div>
        <ButtonLink href={ROUTES.home}>{cs.common.home}</ButtonLink>
      </Panel>
    </div>
  );
}
