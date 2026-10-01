# web

The UI: Vite, React 19, TypeScript, Tailwind CSS 4, TanStack Router (file
routes) and Query, a hey-api client with Zod (mini) schemas, Vitest, and
Storybook 10 with MSW.

## Commands

Run from `web/`. Story tests need Chromium once:
`pnpm exec playwright install chromium`.

```bash
pnpm dev             # Vite on :5173; /api/ proxies to `make run` (API=http://host:port overrides)
pnpm lint            # eslint, prettier included
pnpm typecheck
pnpm test            # unit tests (jsdom) and every story in Chromium under each theme
pnpm test:unit       # jsdom only; pnpm test:storybook for stories only
pnpm test:coverage   # unit tests with a v8 coverage report
pnpm storybook       # :6006
pnpm build           # tsc -b, then vite build into dist/
pnpm format
```

## Structure

- `src/routes/`: file routes, lowercase. A route sets `head` and renders a
  page, nothing more. `__root.tsx` mounts `AppShell` and the event stream.
- `src/routeTree.gen.ts` is written by the Vite plugin; never edit it. After
  adding, renaming or removing a route, run `pnpm exec vite build` (or
  `pnpm dev`) to regenerate it: `tsc`, and so `pnpm build`, fails until then.
- `src/pages/<section>/<Name>Page.tsx`. `not-found` and `error` are the
  router's fallbacks, wired in `main.tsx`.
- Placement: used by one page → `src/pages/<section>/components/<Name>.tsx`
  or `src/pages/<section>/hooks/`; used by more → `src/components/<Category>/<Name>/`
  or `src/hooks/use<Name>/`, with an `index.ts` that exports only the component
  or hook.
- A component or page is `<Name>.tsx`, `<Name>.types.ts` (props, with doc
  comments), `<Name>.test.tsx` and `<Name>.stories.tsx`.
- `src/lib/`: modules without React (client setup, config, formatting,
  problems).
- Import through `@/`, never `../`.
- Test-only code (tests, stories, `src/test-utils`, `src/design-docs`,
  `src/styles/*.ts`) is excluded from `tsconfig.app.json`, from Tailwind's
  sources in `src/index.css` and from coverage in `vitest.config.ts`. A new
  test-only path goes in all three and in `tsconfig.test.json`.

## Data

- Read server data with `useQuery(get<Op>Options(...))` from
  `@/api/@tanstack/react-query.gen`; types come from `@/api`, schemas from
  `@/api/zod.gen`. Never `fetch` in a component or an effect.
- `useEventStream`, mounted once in `__root.tsx`, is the only `EventSource`. It
  validates each event with its generated schema and writes it into the query
  cache: `setQueryData` when the event is the whole value, `invalidateQueries`
  when it only says something changed. Add new events there; components keep
  reading through `useQuery`.
- The query client's `staleTime` is 30 s because the stream keeps the cache
  fresh. A query the stream does not update sets its own `refetchInterval`.
- Read configuration with `useConfig()`, never `window.__CONFIG__`; the cache
  is seeded from the page before the first render.
- A component that shows a relative time takes `now` (ms) as a prop; pages
  pass `useNow()`.

## Tests

- Unit tests render through `@/test-utils` (`render`, `renderHook`: a fresh
  query client and the app's routes) and add MSW handlers with
  `server.use(...)`; an unmocked request fails. `FakeEventSource` stands in
  for `EventSource`.
- `src/test-utils/handlers/<domain>.ts` holds a fixture typed with `@/api`
  types and a `<domain>Handlers` object with one handler per state (success,
  failure, a pending one that never resolves), re-exported from
  `handlers/index.ts`. Unit tests and stories share them.
- Fixtures, tests and stories take time from `@/test-utils/time` (`NOW_MS`,
  `at(ms)`), never `Date.now()` or a literal date.

## Topic rules

`.claude/rules/` holds the rules for each kind of file. Claude Code loads them
for matching paths; other agents read the matching file before editing.

- `react.md`: components and hooks
- `styling.md`: tokens, themes, Tailwind classes, adding a token
- `loading-states.md`: async data in pages and components
- `storybook.md`: stories and Foundations pages
