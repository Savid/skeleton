import type { JSX } from 'react';
import { namespaceNames, tokenSource } from '@/styles/tokenSource';
import { Block } from './Block';

interface TypeScaleProps {
  /** The line each size sets. */
  sample: string;
}

/** Each type size in tokens.css, largest first, set at the size and line height tokens.css gives it. */
export function TypeScale({ sample }: TypeScaleProps): JSX.Element {
  const { theme } = tokenSource;
  const sizes = namespaceNames('text').reverse();
  return (
    <Block className="flex flex-col gap-4">
      {sizes.map(size => (
        <div key={size} className="flex items-baseline gap-6">
          <span className="w-28 shrink-0 font-mono text-caption text-muted">text-{size}</span>
          <span style={{ fontSize: theme.get(`text-${size}`), lineHeight: theme.get(`text-${size}--line-height`) }}>
            {sample}
          </span>
        </div>
      ))}
    </Block>
  );
}
