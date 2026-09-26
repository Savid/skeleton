import type { Config } from '@/api';

// The root route reads this through useConfig; the page's injection normally
// supplies it, so no story fetches it yet. Add MSW handlers here when one does.
export const configFixture: Config = { name: 'skeleton', version: '0.1.0' };
