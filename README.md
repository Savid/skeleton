# skeleton

A Go daemon (`skeletond`) serving a spec-first HTTP API and an embedded React
UI from one static binary. Running it shows a home page with the daemon's
health, kept live over server-sent events. Its rules are tests and lint, not
review notes: generated code matches the spec, every operation is served,
imports respect boundaries, every style value is a contrast-checked token,
every story is a browser test in both themes.

Clone it as a base, or lift a part below. Rules and layout:
[AGENTS.md](AGENTS.md), [web/AGENTS.md](web/AGENTS.md).

## Quick start

Go 1.27 and golangci-lint 2.14 (`.tool-versions`); Node 24 and pnpm 12
(`package.json`).

```bash
pnpm install
make build WEB=1 && build/bin/skeletond   # http://127.0.0.1:8080; -h lists flags
make check                                # what CI runs
```

UI work: `make run` and `pnpm --dir web dev` (:5173, proxies `/api/`).
`make storybook` (:6006). Browser tests need
`pnpm --dir web exec playwright install chromium`. `make help` lists targets.

## Parts

What each does, and where it lives.

- **Spec-first API.** `api/openapi.yaml` generates the Go server (ogen,
  `api/rest/`) and the web client (hey-api: types, Zod schemas, TanStack Query
  options, `web/src/api/`); `make generate-check` fails on stale output. The
  daemon serves the spec at `/openapi.yaml`. `api/`, `web/openapi-ts.config.ts`,
  `web/src/lib/api-client.ts`.
- **Daemon.** Flags, slog (text or JSON), graceful shutdown, RFC 9457 problem
  errors. `cmd/skeletond/`, `internal/server/{server,operations}.go`,
  `web/src/lib/problem.ts`.
- **Config in the page.** `getConfig`'s JSON is injected into `index.html`;
  the UI validates it and seeds the query cache before the first render.
  `internal/ui/handler.go` (`Inject`), `web/index.html`,
  `web/src/lib/{config,query-client}.ts`, `web/src/hooks/useConfig/`.
- **Request IDs.** `X-Request-Id` (the proxy's or a new one) is echoed and
  added to every log line in the request; access log at debug, warn on 5xx.
  `internal/server/{requestid,accesslog}.go`. Stdlib only.
- **Event stream.** SSE, hand-routed beside ogen; a contract test fails if any
  spec operation isn't served with its declared content type. The UI opens one
  `EventSource`, validates each event and writes it into the query cache,
  reconnecting with backoff. `internal/server/{sse,stream,contract_test}.go`,
  `web/src/hooks/useEventStream/`.
- **Embedded SPA.** `web/dist` embedded; index fallback for client routes, 404
  for `/api/` and missing files, immutable `assets/`. `web/embed.go`,
  `internal/ui/`. Stdlib only.
- **Import boundaries.** Who may import what, as a Go test, with lint twins.
  `internal/testutil/importguard/`, `api/generation_test.go`, `.golangci.yml`
  (`depguard`, `forbidigo`).
- **Web stack.** Vite, React 19, TypeScript, Tailwind 4, TanStack Router (file
  routes) and Query, not-found and error pages. `web/src/{routes,pages,components}/`,
  `web/src/main.tsx`.
- **Design tokens.** One `@theme` of light/dark colour pairs and sizes with
  Tailwind's defaults removed, so only tokens compile; tests check contrast in
  both themes; Storybook Foundations pages document them. `web/src/styles/`,
  `web/src/design-docs/`, `web/.claude/rules/styling.md`.
- **Tests.** Go with `-race`; Vitest in jsdom; every story in Chromium under
  each colour scheme, failing on accessibility violations, console errors and
  unmocked `/api/` calls; MSW handlers shared by both. `web/vitest.config.ts`,
  `web/.storybook/`, `web/src/test-utils/`.
- **Lint.** golangci-lint, eslint (React Compiler, token-only classes, zero
  warnings), prettier, knip, Redocly, govulncheck, tidy check. `.golangci.yml`,
  `web/eslint.config.js`, `knip.ts`, `.redocly.yaml`.
- **Image and CI.** Static binary on distroless, nonroot; CI runs api, go, web
  and image jobs and builds the image without pushing it. `Dockerfile`,
  `.github/workflows/ci.yml`.
- **Agent guidance.** `AGENTS.md`, `web/AGENTS.md`, `web/.claude/rules/`,
  `.agents/skills/` (also `.claude/skills`).

Not included: storage, authentication (the spec declares none), TLS, metrics or
tracing, environment or file configuration (flags only), image publishing.

## Renaming

`git grep -il skeleton` lists every file that names it; replace the name in
each (the `go.mod` module path `github.com/savid/skeleton` reaches every
import, `importguard.go` and `.golangci.yml`), rename `cmd/skeletond/`, then run
`make generate`.

The health check is the placeholder domain: `getHealth` and `Health` in the
spec, the stream's `health` event (`internal/server/stream.go`), `HomePage` and
`HealthCard`, and `test-utils/handlers/health.ts`. Replace it with yours.

## License

[MIT](LICENSE)
