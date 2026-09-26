import type { JSX } from 'react';
import { Link } from '@tanstack/react-router';
import { StatusBadge } from '@/components/Feedback/StatusBadge';
import type { StatusTone } from '@/components/Feedback/StatusBadge/StatusBadge.types';
import type { StreamConnection } from '@/hooks/useEventStream';
import type { AppShellProps } from './AppShell.types';

const connections: Record<StreamConnection, { label: string; tone: StatusTone }> = {
  connecting: { label: 'connecting', tone: 'neutral' },
  live: { label: 'live', tone: 'ok' },
  reconnecting: { label: 'reconnecting', tone: 'warn' },
};

/** Page frame: top bar with the product name, navigation and stream state, then the page. */
export function AppShell({ connection, children }: AppShellProps): JSX.Element {
  const { label, tone } = connections[connection];

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center gap-6 border-b border-border bg-surface px-6 py-3">
        <span className="font-mono text-sm font-semibold tracking-wide text-accent">skeleton</span>
        <nav className="flex flex-1 gap-4 text-sm">
          <Link to="/" className="text-muted hover:text-foreground" activeProps={{ className: 'text-foreground' }}>
            Home
          </Link>
        </nav>
        <StatusBadge tone={tone}>{label}</StatusBadge>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
