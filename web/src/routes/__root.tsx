import type { JSX } from 'react';
import { createRootRoute, HeadContent, Outlet } from '@tanstack/react-router';
import { AppShell } from '@/components/Layout/AppShell';
import { useEventStream } from '@/hooks/useEventStream';

/** One event stream for the whole app; pages read its data through their queries. */
function Root(): JSX.Element {
  const connection = useEventStream();

  return (
    <>
      <HeadContent />
      <AppShell connection={connection}>
        <Outlet />
      </AppShell>
    </>
  );
}

export const Route = createRootRoute({ component: Root });
