/**
 * The colour tokens, grouped as the Foundations docs present them, and the
 * contrast each must reach. Values live only in tokens.css; tokens.test.ts
 * fails if the two disagree. Other tokens are read from tokens.css itself.
 */

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

/** Where content sits, back to front. */
export const SURFACE_COLORS = ['background', 'surface'] as const;
export const BORDER_COLORS = ['border', 'border-strong'] as const;
export const TEXT_COLORS = ['foreground', 'muted'] as const;
export const ACCENT_COLORS = ['accent', 'accent-foreground', 'focus'] as const;
export const STATUS_COLORS = ['ok', 'warn', 'danger'] as const;

export const COLOR_TOKENS = [
  ...SURFACE_COLORS,
  ...BORDER_COLORS,
  ...TEXT_COLORS,
  ...ACCENT_COLORS,
  ...STATUS_COLORS,
] as const;
export type ColorToken = (typeof COLOR_TOKENS)[number];

export interface ContrastRule {
  /** What the rule protects, as the docs name it. */
  name: string;
  foregrounds: readonly ColorToken[];
  backgrounds: readonly ColorToken[];
  /** WCAG 2.2 AA: 4.5 for text, 3 for outlines and marks. */
  minimum: number;
}

/** Every pair tokens.test.ts checks in both themes, and the Colours page shows. */
export const CONTRAST_RULES: readonly ContrastRule[] = [
  {
    name: 'Text and status colours on every surface',
    foregrounds: [...TEXT_COLORS, 'accent', ...STATUS_COLORS],
    backgrounds: SURFACE_COLORS,
    minimum: 4.5,
  },
  {
    name: 'Control outlines and the focus ring on every surface',
    foregrounds: ['border-strong', 'focus'],
    backgrounds: SURFACE_COLORS,
    minimum: 3,
  },
  {
    name: 'Text on an accent fill',
    foregrounds: ['accent-foreground'],
    backgrounds: ['accent'],
    minimum: 4.5,
  },
];

/** Colours no contrast rule covers, and why none needs to. */
export const CONTRAST_EXEMPT: Readonly<Partial<Record<ColorToken, string>>> = {
  border: 'separates; it identifies nothing you act on',
};
