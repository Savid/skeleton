---
name: web-page
description: Add a page to the web UI — route file, page component, nav link and tests — following web/AGENTS.md. Use when asked to add a screen, view or page.
---

# Add a web page

Read [web/AGENTS.md](../../../web/AGENTS.md) first. It owns the structure and
rules; this skill is the order of work.

1. **Name it.** Pick the URL (`/sessions`), the section folder (`sessions`) and
   the page component (`SessionsPage`). Check `src/routes/` and `src/pages/` for
   something to extend before adding.
2. **Page.** Create `web/src/pages/<section>/<Name>Page.tsx`. Components used
   only by this page go in `web/src/pages/<section>/components/`. Anything a
   second page needs goes in `web/src/components/<Category>/<Name>/` with its
   `.types.ts`, `.test.tsx`, `.stories.tsx` and `index.ts`.
3. **Data.** Read through the generated query options
   (`useQuery(getXOptions(...))` from `@/api/@tanstack/react-query.gen`). If the
   operation doesn't exist yet, add it to `api/openapi.yaml`, run
   `make generate`, and implement it on `operations` in `internal/server` with a
   Go test. Live data arrives through `useEventStream` in `web/src/hooks/`,
   which writes events into the query cache; add the event there.
4. **Route.** Create `web/src/routes/<path>.tsx` that only sets `head` and
   renders the page, like `routes/index.tsx`. The Vite plugin regenerates
   `routeTree.gen.ts` on `pnpm dev` or `pnpm build`; include that change.
5. **Nav.** Add a `Link` in `web/src/components/Layout/AppShell/AppShell.tsx`
   if the page belongs in the top bar.
6. **Tests.** `<Name>Page.test.tsx` beside the page, rendering through
   `@/test-utils` with MSW handlers added by `server.use(...)`, and
   `FakeEventSource` for streams. Cover loading, error and settled states.
7. **Stories.** `<Name>Page.stories.tsx` titled `Pages/<Section>/<Name>Page`,
   plus stories for each new component. Add MSW handlers for the new endpoint to
   `web/src/test-utils/handlers.ts` (one per state) and follow
   `web/.claude/rules/storybook.md`.
8. **Check.** From the repo root: `make lint-web test-web`, plus
   `make lint-api test-go` if you touched the spec or the server.
