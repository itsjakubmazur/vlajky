import { notFound } from 'next/navigation';
import { MODE_SLUGS, isModeSlug } from '@/config/routes';
import { QuizScreen } from '@/components/quiz/QuizScreen';

export function generateStaticParams() {
  return Object.keys(MODE_SLUGS).map((mode) => ({ mode }));
}

export default async function PlayPage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (!isModeSlug(mode)) notFound();
  return <QuizScreen mode={MODE_SLUGS[mode]} />;
}
