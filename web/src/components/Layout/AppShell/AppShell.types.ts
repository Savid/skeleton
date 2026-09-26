import type { ReactNode } from 'react';
import type { StreamConnection } from '@/hooks/useEventStream';

export interface AppShellProps {
  /** The event stream's state, shown in the top bar. */
  connection: StreamConnection;

  /** The current page. */
  children: ReactNode;
}
