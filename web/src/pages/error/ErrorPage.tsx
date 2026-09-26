import type { JSX } from 'react';
import { Link } from '@tanstack/react-router';
import type { ErrorPageProps } from './ErrorPage.types';

function describe(error: unknown): string {
  if (error instanceof Error && error.message !== '') return error.message;
  if (typeof error === 'string' && error !== '') return error;
  return 'Something went wrong while rendering this page.';
}

/** The router's error boundary: what failed, a retry, and a way home. */
export function ErrorPage({ error, reset }: ErrorPageProps): JSX.Element {
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-3">
      <h1 className="text-2xl font-semibold">Something broke</h1>
      <p role="alert" className="font-mono text-sm text-danger">
        {describe(error)}
      </p>
      <div className="flex gap-4 text-sm">
        <button type="button" onClick={reset} className="rounded-sm border border-border px-3 py-1 hover:border-accent">
          Try again
        </button>
        <Link to="/" className="self-center text-accent underline">
          Back home
        </Link>
      </div>
    </section>
  );
}
