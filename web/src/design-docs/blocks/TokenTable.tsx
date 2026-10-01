import type { JSX } from 'react';
import { namespaceNames, tokenSource } from '@/styles/tokenSource';
import { Table } from './Table';

interface TokenTableProps {
  /** Tailwind theme namespace, such as `radius` or `container`. */
  namespace: string;
  /** The class a token gives. */
  usage: (name: string) => string;
  /** What each token is for. */
  notes: Readonly<Record<string, string>>;
}

/** Every token in a namespace, as tokens.css defines it; a type size shows its line height too. */
export function TokenTable({ namespace, usage, notes }: TokenTableProps): JSX.Element {
  const { theme } = tokenSource;
  return (
    <Table
      head={['token', 'value', 'use as', 'for']}
      rows={namespaceNames(namespace).map(name => {
        const property = `${namespace}-${name}`;
        const lineHeight = theme.get(`${property}--line-height`);
        return {
          key: name,
          cells: [
            `--${property}`,
            <span key="value" className="font-mono text-caption">
              {theme.get(property)}
              {lineHeight === undefined ? '' : ` / ${lineHeight}`}
            </span>,
            <span key="usage" className="font-mono text-caption text-foreground">
              {usage(name)}
            </span>,
            notes[name] ?? '',
          ],
        };
      })}
    />
  );
}
