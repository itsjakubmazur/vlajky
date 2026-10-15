import type { Metadata } from 'next';
import { cs } from '@/i18n/cs';
import { MathScreen } from '@/components/math/MathScreen';

export const metadata: Metadata = { title: cs.math.title };

export default function MathPage() {
  return <MathScreen />;
}
