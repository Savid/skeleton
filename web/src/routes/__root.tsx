import type { JSX } from 'react';
import { createRootRoute, HeadContent, Outlet } from '@tanstack/react-router';
import { AppShell } from '@/components/Layout/AppShell';
import { useConfig } from '@/hooks/useConfig';
import { useEventStream } from '@/hooks/useEventStream';

/** One event stream for the whole app; pages read its data through their queries. */
function Root(): JSX.Element {
  const connection = useEventStream();
  const config = useConfig();

  return (
    <>
      <HeadContent />
      <AppShell name={config.data?.name} connection={connection}>
        <Outlet />
      </AppShell>
    </>
  );
}

export const Route = createRootRoute({ component: Root });
