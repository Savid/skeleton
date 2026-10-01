---
description: Tokens, themes and Tailwind
paths:
  - '**/src/**/*.tsx'
  - '**/src/**/*.ts'
  - '**/src/**/*.css'
  - '**/src/**/*.mdx'
---

# Styling

- Every value is a token from `src/styles/tokens.css`, used as a Tailwind class.
  Its `@theme` block starts with `--*: initial`, so Tailwind's defaults are
  gone and only tokens compile: `bg-red-500` and `rounded-xl` do not exist.
  Spacing and sizing use the 4px step (`p-4`, `gap-6`, `size-8`); line height
  comes with each text size.
- Lint checks class strings in `className`, `clsx` and other known callees, the
  router's `activeProps` / `inactiveProps` objects, and variant maps named
  `…Classes` or `…Styles` (`const toneClasses: Record<Tone, string> = {…}`).
  Keep each class whole (not `` `text-${tone}` ``) so lint checks it and
  Tailwind finds it. It rejects unknown classes, arbitrary values (`w-[13px]`,
  `bg-(--x)`), `dark:`, `leading-*`, opacity and line-height modifiers
  (`bg-accent/10`), `style` props, and colours in SVG paint attributes (use
  `fill-current`).
- Name tokens for their role (`danger`, `muted`, `page`), never their look.
- Two themes, always both: each colour is a `light-dark(light, dark)` pair. The
  page follows the system's colour scheme; `data-theme="light"` or `"dark"` on
  `<html>` forces one, and nothing else sets a theme.
- `tokens.css` is the only stylesheet with colour literals. `index.html`'s
  theme colours and the favicon repeat token values, and the test checks them.
- Text and status colours reach 4.5:1 on every surface, control outlines and
  the focus ring 3:1, in both themes. Every story is tested in both themes too;
  axe measures text only, so outlines rely on the token test.
- No state is carried by colour alone: a word or a mark goes with it (the
  current nav item is underlined, a badge has a word). Draw meaningful dots and
  icons in `currentColor`, so forced colours keep them.

## Adding or changing a token

1. Add it to the `@theme` block in `tokens.css`, in Tailwind's namespace for
   it (`--color-*`, `--text-*`, `--radius-*`, `--container-*`, …). A colour is a
   `light-dark(light, dark)` pair of hex or `rgb()` values, or `var()` of
   another colour.
2. For a colour, add its name to the right group in `src/styles/tokens.ts`, and
   put it in a contrast rule there (`CONTRAST_RULES`) or in `CONTRAST_EXEMPT`
   with the reason it needs none.
3. Show it on its Foundations page, in the page's `.stories.tsx`.
4. `pnpm test` checks the file's shape, the colour names, and contrast in both
   themes.
