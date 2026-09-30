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
- Export order is meaning; autodocs renders in it. `Default` first, then
  variants, then states (`Loading`, `Empty`, `Error`, `Disabled` as they
  apply), then edge cases (overflow, long identifiers, zero and huge counts),
  then `…Interaction` play stories last. `Default`'s args drive the controls,
  so controls must change what renders.
- Fixtures and stories share one frozen clock: `NOW_MS` and `at()` from
  `@/test-utils/time`. Never `Date.now()` or a literal date in a fixture.
- Full-page stories use `tags: ['!autodocs']` and `layout: 'fullscreen'`.
- Mock the API per story with `parameters.msw.handlers`, reusing the handlers
  exported from `@/test-utils/handlers` (one file per API domain in
  `src/test-utils/handlers/`). A story that opens an event stream mocks it with
  an MSW `sse()` handler. An unmocked `/api/` request, including a stream a page
  opens, fails the story.
- One story per state that matters: loading uses a handler that never resolves
  (`healthHandlers.pending`), errors use a failing one. Each `play` awaits the
  exact state the story shows, with `findBy…` for async data.
- Await every `expect` and `userEvent` in `play`.
