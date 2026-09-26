import type { ReactNode } from 'react';
import type { StreamConnection } from '@/hooks/useEventStream';

export interface AppShellProps {
  /** The daemon's display name from its configuration; undefined until known. */
  name: string | undefined;

  /** The event stream's state, shown in the top bar. */
  connection: StreamConnection;

  /** The current page. */
  children: ReactNode;
}
