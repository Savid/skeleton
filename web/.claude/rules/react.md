---
paths:
  - '**/src/**/*.tsx'
  - '**/src/**/*.ts'
---

# React

- Components are function declarations returning `JSX.Element`, with props
  typed in `<Name>.types.ts`.
- Derive values during render. Don't copy props or query data into state, or
  set state in an effect to mirror something you can compute.
- `useMemo`/`memo` only for expensive work or for an identity a downstream
  memo depends on. The React Compiler's rules run in lint only; the build does
  not memoize for you.
