import type { Config } from '@/api';

// The root route reads this through useConfig. The page's injection supplies
// it, so stories don't fetch it.
export const configFixture: Config = { name: 'skeleton', version: '0.1.0' };
