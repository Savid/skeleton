import { describe, expect, it } from 'vitest';
import { render, screen, server } from '@/test-utils';
import { healthHandlers } from '@/test-utils/handlers';
import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('renders the heading and the health card', async () => {
    server.use(healthHandlers.ok);
    render(<HomePage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    expect(await screen.findByText('0.1.0')).toBeInTheDocument();
  });
});
