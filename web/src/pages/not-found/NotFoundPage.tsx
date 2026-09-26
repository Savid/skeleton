import type { JSX } from 'react';
import { Link } from '@tanstack/react-router';

export function NotFoundPage(): JSX.Element {
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-2">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="text-sm text-muted">
        Nothing lives here.{' '}
        <Link to="/" className="text-accent underline">
          Back home
        </Link>
      </p>
    </section>
  );
}
