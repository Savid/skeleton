---
paths:
  - '**/src/**/*.tsx'
  - '**/src/**/*.ts'
  - '**/src/**/*.css'
  - '**/src/**/*.mdx'
---

# Styling

- Every value is a token in `src/styles/tokens.css`, used as a Tailwind class.
  Tailwind's defaults are removed, so `bg-red-500` and `rounded-xl` do not
  exist. Spacing and sizing use the 4px step (`p-4`, `gap-6`, `size-8`); each
  text size carries its line height.
- Lint rejects classes and colours that bypass the tokens. It reads class
  strings in `className`, `clsx`, the router's `activeProps` and
  `inactiveProps`, and variant maps named `…Classes` or `…Styles`. Write each
  class whole (not `` `text-${tone}` ``) so lint checks it and Tailwind finds
  it.
- Name tokens for their role (`danger`, `muted`, `page`), never their look.
- Every colour is a `light-dark(light, dark)` pair. The page follows the
  system's colour scheme; only `data-theme="light"` or `"dark"` on `<html>`
  forces one.
- No state is carried by colour alone: a word or a mark goes with it (the
  current nav item is underlined, a badge has a word). Draw meaningful dots and
  icons in `currentColor`, so forced colours keep them.

## Adding a token

1. Add it to the `@theme` block in `tokens.css`, in Tailwind's namespace for it
   (`--color-*`, `--text-*` with its `--text-*--line-height`, `--radius-*`,
   `--container-*`, …). A colour is `light-dark()` of two hex or `rgb()` values,
   or `var()` of another colour.
2. Add a colour's name to its group in `src/styles/tokens.ts`, and to a
   `CONTRAST_RULES` entry or to `CONTRAST_EXEMPT` with the reason.
3. The Foundations pages list every token in a namespace they already show. A
   new namespace needs a story on the matching page in `src/design-docs/`.
4. `pnpm test:unit` checks the file, the colour names and contrast in both
   themes, and that `index.html`'s theme colours and `public/favicon.svg` use
   token values.
