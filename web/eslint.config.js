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

export default defineConfig(
  {
    // src/api is generated from ../api/openapi.yaml (pnpm generate:api).
    ignores: ['dist', 'node_modules', 'storybook-static', '.storybook/public', 'src/routeTree.gen.ts', 'src/api'],
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
    },
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
