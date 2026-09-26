import type { JSX } from 'react';
import clsx from 'clsx';
import type { StatusBadgeProps, StatusTone } from './StatusBadge.types';

const toneStyles: Record<StatusTone, { dot: string; text: string }> = {
  ok: { dot: 'bg-ok', text: 'text-ok' },
  warn: { dot: 'bg-warn', text: 'text-warn' },
  danger: { dot: 'bg-danger', text: 'text-danger' },
  neutral: { dot: 'bg-muted', text: 'text-muted' },
};

export function StatusBadge({ tone = 'neutral', children }: StatusBadgeProps): JSX.Element {
  const styles = toneStyles[tone];

  return (
    <span
      data-tone={tone}
      className={clsx(
        'inline-flex items-center gap-2 rounded-sm border border-border px-2 py-0.5 text-xs',
        styles.text
      )}
    >
      <span aria-hidden="true" className={clsx('size-2 rounded-full', styles.dot)} />
      {children}
    </span>
  );
}
