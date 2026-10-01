---
name: web-page
description: Add a page to the web UI — route, page component, nav link, tests and stories. Use when asked to add a screen, view or page.
---

# Add a web page

[web/AGENTS.md](../../../web/AGENTS.md) and its topic rules own the
conventions; this is the order of work. Paths are under `web/`.

1. **Name it.** Pick the URL, the section folder and the page component
   (`<Name>Page`). If a page in `src/pages/` already covers it, extend that.
2. **Data.** If the page needs an operation that does not exist, add it first
   ([AGENTS.md](../../../AGENTS.md), API), with its handlers and fixture in
   `src/test-utils/handlers/`.
3. **Page.** `src/pages/<section>/<Name>Page.tsx`, its components and hooks
   placed by the placement rule. Render every state in
   `.claude/rules/loading-states.md`.
4. **Route.** `src/routes/<path>.tsx` sets `head` and renders the page, like
   `src/routes/index.tsx`. Run `pnpm exec vite build` to regenerate
   `src/routeTree.gen.ts`, and commit it.
5. **Nav.** If the page belongs in the top bar, add a `Link` in
   `src/components/Layout/AppShell/AppShell.tsx`.
6. **Tests and stories.** For the page and each new component, a test and
   stories covering each state, titled per `.claude/rules/storybook.md`.
7. **Check.** Run the lint and test targets for each side you touched
   (AGENTS.md, Commands).
