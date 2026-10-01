import type { JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getHealthOptions } from '@/api/@tanstack/react-query.gen';
import { StatusBadge } from '@/components/Feedback/StatusBadge';
import { formatAge } from '@/lib/format';
import type { HealthCardProps } from './HealthCard.types';

/** The server's health: version and when it last answered. The event stream keeps it fresh. */
export function HealthCard({ now }: HealthCardProps): JSX.Element {
  const health = useQuery(getHealthOptions());

  return (
    <section aria-labelledby="health-heading" className="rounded-md border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 id="health-heading" className="text-title font-semibold">
          Server
        </h2>
        {health.isPending ? (
          <StatusBadge>connecting</StatusBadge>
        ) : health.isError ? (
          <StatusBadge tone="danger">unreachable</StatusBadge>
        ) : (
          <StatusBadge tone="ok">{health.data.status}</StatusBadge>
        )}
      </div>

      {health.isPending ? (
        <p role="status" className="mt-2 text-body text-muted">
          Loading the server's health…
        </p>
      ) : health.isError ? (
        <p role="alert" className="mt-2 text-body text-danger">
          Could not reach the server.
        </p>
      ) : (
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-body">
          <div>
            <dt className="text-caption text-muted">Version</dt>
            <dd className="font-mono">{health.data.version}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted">Last answer</dt>
            <dd className="font-mono">{formatAge(health.data.at, now)} ago</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
