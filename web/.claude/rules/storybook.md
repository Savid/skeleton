---
description: Storybook story conventions
paths:
  - '**/src/**/*.stories.tsx'
  - '**/src/**/*.mdx'
  - '**/.storybook/**'
---

# Storybook

- Every story is a test (`pnpm test:storybook`): it must render in Chromium,
  pass its `play` function, log no console errors and have no accessibility
  violations. Fix a failing story; never exclude it.
- Titles: reusable components `Components/<Category>/<Name>`; page-only parts
  `Pages/<Section>/Components/<Name>`; full pages `Pages/<Section>/<Name>Page`;
  docs pages `Design/<Name>`.
- A `Default` story comes first. Its args drive the controls, so controls must
  change what renders.
- Full-page stories use `tags: ['!autodocs']` and `layout: 'fullscreen'`.
- Mock the API per story with `parameters.msw.handlers`, reusing the handlers in
  `src/test-utils/handlers.ts` and, for event streams,
  `src/test-utils/stream-handlers.ts`. An unmocked `/api/` request, including a
  stream a page opens, fails the story.
- One story per state that matters: loading uses a handler that never resolves
  (`healthHandlers.pending`), errors use a failing one. Each `play` awaits the
  exact state the story shows, with `findBy…` for async data.
- Await every `expect` and `userEvent` in `play`.
