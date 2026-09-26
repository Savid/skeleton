import type { JSX } from 'react';
import { useNow } from '@/hooks/useNow';
import { HealthCard } from './components/HealthCard';

export function HomePage(): JSX.Element {
  const now = useNow();

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Home</h1>
      <HealthCard now={now} />
    </section>
  );
}
