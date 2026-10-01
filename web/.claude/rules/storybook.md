---
paths:
  - '**/src/**/*.stories.tsx'
  - '**/src/**/*.mdx'
  - '**/.storybook/**'
---

# Storybook

- Every story is a test in Chromium under each colour scheme
  (`pnpm test:storybook`). A failed `play`, a console error, an accessibility
  violation or an unmocked `/api/` request fails it. Fix the story; never
  exclude it.
- Titles: `Components/<Category>/<Name>`; page-only components
  `Pages/<Section>/Components/<Name>`; pages `Pages/<Section>/<Name>Page`,
  with `tags: ['!autodocs']` and `layout: 'fullscreen'`.
- A Foundations page is `src/design-docs/<Name>.mdx` (prose, and a
  `<Story of={Stories.X} />` for every example) plus `<Name>.stories.tsx`
  (titled `Foundations/<Name>`, tagged `!dev`, holding the examples). List it
  in `storySort` in `.storybook/preview.tsx`.
- Export order is the docs order: `Default`, variants, states (`Loading`,
  `Empty`, `Error`, `Disabled` as they apply), edge cases (overflow, long
  identifiers, zero and huge counts), then `…Interaction` stories. `Default`'s
  args drive the controls, so each control must change what renders.
- Mock the API per story with `parameters.msw.handlers`, reusing
  `@/test-utils/handlers`: the pending handler for loading, the failing one for
  errors. A component that opens an event stream needs MSW's `sse()`.
- Each `play` awaits the exact state its story shows, with `findBy…` for async
  data. Await every `expect` and `userEvent`.
