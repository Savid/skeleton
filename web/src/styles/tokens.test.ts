import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio, sameColor } from './contrast';
import { colorValue, namespaceNames, tokenSource } from './tokenSource';
import { COLOR_TOKENS, CONTRAST_EXEMPT, CONTRAST_RULES, THEMES } from './tokens';

const { blocks, statements, theme } = tokenSource;

const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(/i;
const read = (file: string): string => readFileSync(join(import.meta.dirname, file), 'utf8');

describe('tokens.css', () => {
  it('imports Tailwind and holds the colour schemes and one @theme block, nothing else', () => {
    expect(statements).toEqual(["@import 'tailwindcss' source(none)"]);
    expect(blocks.map(block => block.header).sort()).toEqual(
      [':root', ...THEMES.map(name => `:root[data-theme='${name}']`), '@theme'].sort()
    );
  });

  it('sets only the colour scheme outside @theme', () => {
    const stray = blocks
      .filter(block => block.header !== '@theme')
      .flatMap(block => [...block.declarations.keys()].filter(property => property !== 'color-scheme'));
    expect(stray).toEqual([]);
  });

  it("removes Tailwind's defaults before defining any token", () => {
    expect([...theme.entries()][0]).toEqual(['*', 'initial']);
  });

  it('writes colour literals in colour tokens only', () => {
    const literals = [...theme].filter(([name, value]) => !name.startsWith('color-') && COLOR_LITERAL.test(value));
    expect(literals.map(([name]) => `--${name}`)).toEqual([]);
  });
});

describe('colours', () => {
  it('defines exactly the colours tokens.ts names, each a light-dark() pair or another colour', () => {
    expect(namespaceNames('color').sort()).toEqual([...COLOR_TOKENS].sort());
    for (const name of COLOR_TOKENS) {
      expect(theme.get(`color-${name}`), name).toMatch(/^(?:light-dark\(.+\)|var\(--color-[a-z-]+\))$/);
    }
  });

  it('puts every colour in a contrast rule, or exempts it with a reason', () => {
    const ruled = new Set(CONTRAST_RULES.flatMap(rule => [...rule.foregrounds, ...rule.backgrounds]));
    expect(COLOR_TOKENS.filter(token => !ruled.has(token) && CONTRAST_EXEMPT[token] === undefined)).toEqual([]);
  });
});

describe.each(THEMES)('contrast in the %s theme (WCAG 2.2 AA)', name => {
  it.each(CONTRAST_RULES.map(rule => [rule.name, rule] as const))('%s', (_, rule) => {
    for (const foreground of rule.foregrounds) {
      for (const background of rule.backgrounds) {
        const ratio = contrastRatio(colorValue(name, foreground), colorValue(name, background));
        expect(ratio, `${foreground} on ${background}`).toBeGreaterThanOrEqual(rule.minimum);
      }
    }
  });
});

describe('outside tokens.css', () => {
  it('declares no tokens, @theme or colour literals in the other stylesheets', () => {
    const sheets = [
      ...readdirSync(import.meta.dirname).filter(file => file.endsWith('.css') && file !== 'tokens.css'),
      '../index.css',
      '../../.storybook/preview.css',
    ];
    for (const sheet of sheets) {
      const text = read(sheet).replace(/\/\*[\s\S]*?\*\//g, '');
      expect(text, sheet).not.toMatch(/--[a-z-]+\s*:|@theme|@utility|@custom-variant/);
      expect(text, sheet).not.toMatch(COLOR_LITERAL);
    }
  });

  it("gives index.html each theme's background as its theme colour", () => {
    const html = read('../../index.html');
    for (const name of THEMES) {
      const meta = new RegExp(`name="theme-color" content="([^"]+)" media="\\(prefers-color-scheme: ${name}\\)"`);
      const literal = meta.exec(html)?.[1];
      expect(literal, `${name} theme-color meta`).toBeDefined();
      expect(sameColor(literal ?? '', colorValue(name, 'background')), name).toBe(true);
    }
  });

  it('uses only token colours in the favicon', () => {
    const colors = [...read('../../public/favicon.svg').matchAll(/(?:fill|stroke|stop-color)="([^"]+)"/g)].map(
      m => m[1] ?? ''
    );
    expect(colors.length).toBeGreaterThan(0);
    for (const literal of colors) {
      const isToken = THEMES.some(name => COLOR_TOKENS.some(token => sameColor(literal, colorValue(name, token))));
      expect(isToken, literal).toBe(true);
    }
  });
});
