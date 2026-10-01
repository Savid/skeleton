import type { JSX } from 'react';
import clsx from 'clsx';
import type { StatusBadgeProps, StatusTone } from './StatusBadge.types';

const toneStyles: Record<StatusTone, string> = {
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
  neutral: 'text-muted',
};

export function StatusBadge({ tone = 'neutral', children }: StatusBadgeProps): JSX.Element {
  return (
    <span
      data-tone={tone}
      className={clsx(
        'inline-flex items-center gap-2 rounded-sm border border-border px-2 py-0.5 text-caption',
        toneStyles[tone]
      )}
    >
      {/* Drawn in currentColor, so forced colours keep the dot. */}
      <svg aria-hidden="true" viewBox="0 0 8 8" className="size-2 fill-current">
        <circle cx="4" cy="4" r="4" />
      </svg>
      {children}
    </span>
  );
}
