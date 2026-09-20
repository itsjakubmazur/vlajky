import type { QuizModeId } from '@/domain/quiz/modes';

/** České adresy režimů. Slug ↔ režim na jednom místě. */
export const MODE_SLUGS = {
  klasika: 'classic',
  opacne: 'reverse',
  napis: 'typing',
  dvojcata: 'twins',
  opakovani: 'review',
  maraton: 'marathon',
  blesk: 'flash',
  vabank: 'risk',
  'denni-vyzva': 'daily',
  slabiny: 'weak',
  'hlavni-mesta': 'capitals',
} as const satisfies Record<string, QuizModeId>;

export type ModeSlug = keyof typeof MODE_SLUGS;

export const SLUG_BY_MODE = Object.fromEntries(
  Object.entries(MODE_SLUGS).map(([slug, mode]) => [mode, slug]),
) as Record<QuizModeId, ModeSlug>;

export function isModeSlug(value: string): value is ModeSlug {
  return value in MODE_SLUGS;
}

export const ROUTES = {
  home: '/',
  album: '/album',
  placement: '/rozrazovaci-test',
  settings: '/nastaveni',
  bosses: '/souboje',
  insight: '/prehled',
  play: (slug: ModeSlug) => `/hrat/${slug}`,
};
