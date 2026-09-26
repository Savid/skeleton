import type { ReactNode } from 'react';

export type StatusTone = 'ok' | 'warn' | 'danger' | 'neutral';

export interface StatusBadgeProps {
  /**
   * Colour of the dot and label.
   * @default 'neutral'
   */
  tone?: StatusTone;

  /** Short label, e.g. "online". */
  children: ReactNode;
}
