import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@/test-utils';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('frames the page with the product name, navigation and stream state', async () => {
    const root = createRootRoute({
      component: () => (
        <AppShell name="skeleton" connection="reconnecting">
          <p>page body</p>
        </AppShell>
      ),
    });
    const router = createRouter({ routeTree: root, history: createMemoryHistory({ initialEntries: ['/'] }) });
    render(<RouterProvider router={router} />);

    expect(await screen.findByText('page body')).toBeInTheDocument();
    expect(screen.getByText('skeleton')).toBeInTheDocument();
    const home = screen.getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('href', '/');
    // The current page is marked by more than colour.
    expect(home).toHaveAttribute('aria-current', 'page');
    expect(home).toHaveClass('underline');
    expect(screen.getByText('reconnecting')).toHaveAttribute('data-tone', 'warn');
  });
});
