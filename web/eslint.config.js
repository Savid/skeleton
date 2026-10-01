import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintReact from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-plugin-prettier/recommended';
import vitest from '@vitest/eslint-plugin';
import storybook from 'eslint-plugin-storybook';
import betterTailwind from 'eslint-plugin-better-tailwindcss';
import { getDefaultSelectors } from 'eslint-plugin-better-tailwindcss/defaults';

const noColor = 'Colours come from tokens in src/styles/tokens.css, used as Tailwind classes.';
// An opacity or line-height modifier (`bg-accent/10`, `text-body/6`); `w-1/2` is a fraction, not one.
const modifier = '(?:^|:)!?[a-z-]*[a-z]/\\d+!?$';

export default defineConfig(
  {
    // src/api is generated from ../api/openapi.yaml (pnpm generate:api).
    ignores: [
      'dist',
      'node_modules',
      'coverage',
      'storybook-static',
      '.storybook/public',
      'src/routeTree.gen.ts',
      'src/api',
    ],
  },
  {
    // A suppression only stays honest if a dead one fails the build.
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.{ts,tsx}'],
    ...eslintReact.configs['recommended-typescript'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // eslint-plugin-react-hooks owns hooks correctness; @eslint-react's
      // overlapping rules are off so nothing reports twice.
      '@eslint-react/rules-of-hooks': 'off',
      '@eslint-react/exhaustive-deps': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      // React Compiler static analysis. The compiler is not enabled in the
      // build; these rules are a lint-time guard only.
      'react-hooks/preserve-manual-memoization': 'error',
      'react-hooks/immutability': 'error',
      'react-hooks/refs': 'error',
      'react-hooks/set-state-in-effect': 'error',
      'react-hooks/set-state-in-render': 'error',
      'react-hooks/purity': 'error',
      'react-hooks/static-components': 'error',
      'react-hooks/use-memo': 'error',
      'react-hooks/globals': 'error',
      'react-hooks/error-boundaries': 'error',
      'react-hooks/no-deriving-state-in-effects': 'error',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [{ group: ['../*'], message: 'Import through the @/ alias instead of parent-relative paths.' }],
        },
      ],
      'no-restricted-syntax': [
        'error',
        // Inline styles bypass the tokens; the Foundations blocks are the exception.
        { selector: "JSXAttribute[name.name='style']", message: noColor },
        {
          selector:
            "JSXAttribute[name.name=/^(?:fill|stroke|color|stopColor|floodColor|lightingColor)$/] > Literal[value!='currentColor'][value!='none']",
          message: noColor,
        },
      ],
    },
  },
  {
    // Class names must be tokens: Tailwind's defaults are reset in tokens.css,
    // so an unknown class is one no token covers. Besides className, clsx and
    // the plugin's other defaults, it reads variant maps named `…Classes` or
    // `…Styles` and the router's activeProps / inactiveProps.
    files: ['src/**/*.{ts,tsx}'],
    extends: [betterTailwind.configs['correctness-error']],
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/styles/tokens.css',
        selectors: [
          ...getDefaultSelectors(),
          { kind: 'variable', name: '[A-Za-z]*(?:Classes|Styles)', match: [{ type: 'objectValues' }] },
          {
            kind: 'attribute',
            name: '^(?:active|inactive)Props$',
            match: [{ type: 'objectValues', path: '^className$' }],
          },
        ],
      },
    },
    rules: {
      'better-tailwindcss/enforce-canonical-classes': 'error',
      'better-tailwindcss/no-restricted-classes': [
        'error',
        {
          restrict: [
            { pattern: '\\[[^\\[\\]]*\\](?!:)', message: 'Arbitrary values bypass the tokens; add a token instead.' },
            { pattern: '\\(--[^()]*\\)', message: 'Arbitrary variables bypass the tokens; add a token instead.' },
            {
              pattern: '(?:^|:)dark:',
              message: 'Tokens change with the theme; give the colour a light-dark() pair instead of a dark: variant.',
            },
            { pattern: '(?:^|:)!?leading-', message: 'Line height comes with each text size (text-body sets both).' },
            {
              pattern: modifier,
              message: 'Opacity tints and line-height modifiers skip the contrast checks; add a token instead.',
            },
          ],
        },
      ],
    },
  },
  {
    // The Foundations blocks draw swatches in the colours they document.
    files: ['src/design-docs/**/*.tsx'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['src/**/*.test.{ts,tsx}'],
    plugins: { vitest },
    rules: {
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'warn',
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: '@testing-library/react', message: 'Import Testing Library helpers from @/test-utils.' }],
          patterns: [{ group: ['../*'], message: 'Import through the @/ alias instead of parent-relative paths.' }],
        },
      ],
    },
  },
  {
    // Route files export the Route object; Storybook config is not hot-reloaded.
    files: ['src/routes/**/*.{ts,tsx}', '.storybook/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['*.config.{js,ts}', '.storybook/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  storybook.configs['flat/recommended']
);
