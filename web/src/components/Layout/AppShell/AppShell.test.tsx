import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@/test-utils';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('frames the page with the product name, navigation and stream state', async () => {
    const root = createRootRoute({
      component: () => (
        <AppShell connection="reconnecting">
          <p>page body</p>
        </AppShell>
      ),
    });
    const router = createRouter({ routeTree: root, history: createMemoryHistory({ initialEntries: ['/'] }) });
    render(<RouterProvider router={router} />);

    expect(await screen.findByText('page body')).toBeInTheDocument();
    expect(screen.getByText('skeleton')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByText('reconnecting')).toHaveAttribute('data-tone', 'warn');
  });
});
