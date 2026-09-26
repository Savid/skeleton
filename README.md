# skeleton

A starting point for a Go daemon that serves a spec-first HTTP API and an
embedded React UI from one static binary. Clone it, rename it, replace the
health endpoint and the home page with your domain.

What is in the box:

- **API, spec first.** [`api/openapi.yaml`](api/openapi.yaml) is the source of
  truth. The Go server (`api/rest`, [ogen](https://ogen.dev)) and the web
  client (`web/src/api`, [hey-api](https://heyapi.dev): types, Zod schemas,
  TanStack Query options) are generated from it with `make generate`, and CI
  fails when the committed output is stale. Errors are RFC 9457 problems. The
  daemon serves the spec at `/openapi.yaml`.
- **Configuration in the page.** `getConfig` returns the public configuration
  (name, version); the same JSON is injected into `index.html` as
  `window.__CONFIG__`, validated against the generated schema and seeded into
  the query cache before the first render, so the shell never waits for it.
  The Vite dev server serves the page unmodified and the UI fetches instead.
- **Requests.** Every request gets an ID (`X-Request-Id`, the proxy's when it
  sent one) that is echoed in the response and attached to every log line the
  handler writes, plus an access log at debug level, warn on server errors.
- **Event stream.** ogen cannot serve `text/event-stream`, so `streamEvents` is
  declared in the spec and hand-routed; a contract test checks every operation
  in the spec is served with the content type it declares. The UI opens the
  stream once, validates each event against the generated schema and writes it
  into the query cache.
- **UI.** Vite, React 19, TypeScript, Tailwind 4, TanStack Router and Query,
  with not-found and error pages wired into the router. Every component has a
  props type, a test and stories; every story runs as a browser test with
  accessibility checks; unmocked API calls fail tests; eslint warnings fail
  lint.
- **Tooling.** golangci-lint (strict, with `depguard` and `forbidigo`
  guarding `pkg/`), eslint with the React Compiler rules, prettier, knip,
  Redocly, govulncheck and a tidy check; `make check` runs what CI runs.
  Dependency boundaries are a Go test (`internal/testutil/importguard`), and a
  contract test keeps the generated server server-only.
- **Image.** A static binary on distroless, running as nonroot; CI builds it
  on every push.
- **Agent guidance.** `AGENTS.md` and `web/AGENTS.md` describe the layout and
  rules; `.agents/skills/` holds task skills (also visible to Claude Code
  through `.claude/skills`).

## Quick start

Needs Go 1.27 and golangci-lint 2.14 (`.tool-versions`), and Node 24 with
pnpm 12. Both are pinned in `package.json` twice: the `volta` field for
[Volta](https://volta.sh) users, whose shims pick them up automatically, and
`packageManager` for [Corepack](https://nodejs.org/api/corepack.html)
(`corepack enable` once), which is what the Dockerfile and CI use. Keep the
two in step when bumping either.

```bash
pnpm install
make build WEB=1                  # UI embedded in build/bin/skeletond
build/bin/skeletond               # http://127.0.0.1:8080
```

| Flag | Default | |
| --- | --- | --- |
| `-listen` | `127.0.0.1:8080` | HTTP address: API and UI |
| `-log-format` | `text` | `text` for a terminal, `json` for a log collector |
| `-log-level` | `INFO` | `DEBUG` also logs one line per request |
| `-version` | | print the build's version and exit |

For UI work, run `make run` in one terminal and `pnpm --dir web dev` in another,
then open http://localhost:5173. Vite proxies `/api/` to the daemon. Components
and pages also render in Storybook with mocked API responses: `make storybook`,
then http://localhost:6006. Story tests need Playwright's Chromium
(`pnpm --dir web exec playwright install chromium`).

`make help` lists every target. `make check` runs what CI runs; `make audit`
adds a clean UI build and embeds it.

## Renaming

The name appears in: `go.mod` (module path, then every import), `cmd/skeletond`
(directory, `main.go` including the `name` constant the UI shows, `Makefile`,
`Dockerfile`, `.github/workflows/ci.yml`),
`api/openapi.yaml` (title), `package.json` and `web/package.json` (names),
`web/index.html` (title), `web/src/routes/index.tsx` (head title), the
fixtures and stories that use the name, and the `.golangci.yml` import prefix. `AGENTS.md`, `web/AGENTS.md`, this README and
`.agents/skills/web-page/SKILL.md` mention it in prose.

## Layout

```
api/                    openapi.yaml, ogen config; rest/ is generated
cmd/skeletond/          entry point: flags, wiring, shutdown
internal/server/        ogen operations, SSE stream, problems, then the UI
internal/ui/            serves the embedded single-page app
internal/testutil/      importguard: package boundaries as a test
pkg/                    (none yet) pure decision packages, guarded by lint and test
web/                    Vite + React UI; src/api is generated; embed.go embeds web/dist
Dockerfile              the image: UI, then a static binary on distroless
.agents/skills/         task skills for coding agents
```

## Adding to it

- **An operation:** edit `api/openapi.yaml`, `make generate`, implement the
  method on `operations` in `internal/server` (the build fails until you do),
  add a Go test, then use the generated query options in the UI.
- **A stream event:** send it from `streamEvents` in `internal/server/stream.go`,
  document it on the operation in the spec, handle it in
  `web/src/hooks/useEventStream`.
- **A page:** follow `.agents/skills/web-page/SKILL.md`.
- **A Go package:** one concern per `internal/<name>`, an injected
  `*slog.Logger`, its goroutines owned by a `Run(ctx)`, and consumers defining
  the interface they need on their side. A pure decision goes in `pkg/<name>`
  and takes time and randomness as inputs.
- **A boundary:** a line in `internal/testutil/importguard/boundary_test.go`.
