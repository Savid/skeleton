import type { JSX } from 'react';
import { Link } from '@tanstack/react-router';

export function NotFoundPage(): JSX.Element {
  return (
    <section className="mx-auto flex max-w-narrow flex-col gap-2">
      <h1 className="text-heading font-semibold">Not found</h1>
      <p className="text-body text-muted">
        Nothing lives here.{' '}
        <Link to="/" className="text-accent underline">
          Back home
        </Link>
      </p>
    </section>
  );
}
