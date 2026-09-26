---
description: React and hooks discipline
paths:
  - '**/src/**/*.tsx'
  - '**/src/**/*.ts'
---

# React

- ESLint runs the React Compiler's static analysis (`eslint-plugin-react-hooks`
  v7). The compiler is not enabled in the build; the rules are a lint-time guard.
- Fix findings instead of suppressing them. A deliberate exception is one
  `eslint-disable-next-line react-hooks/<rule> -- <why this site is safe>`,
  never file-wide. Unused disable directives fail lint.
- Derive values during render. Don't copy props or query data into state, and
  don't set state from an effect to mirror something you can compute.
- `useMemo`/`memo` only for genuinely expensive work or to keep one stable
  identity that downstream memos depend on.
- Server data comes from TanStack Query hooks; never `fetch` in a component or
  an effect.
- Components are function declarations with an explicit `JSX.Element` return
  type and props typed in `[Name].types.ts`.
