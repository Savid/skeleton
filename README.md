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
- **Event stream.** ogen cannot serve `text/event-stream`, so `streamEvents` is
  declared in the spec and hand-routed; a contract test checks every operation
  in the spec is served with the content type it declares. The UI opens the
  stream once, validates each event against the generated schema and writes it
  into the query cache.
- **UI.** Vite, React 19, TypeScript, Tailwind 4, TanStack Router and Query.
  Every component has a props type, a test and stories; every story runs as a
  browser test with accessibility checks; unmocked API calls fail tests.
- **Tooling.** golangci-lint (strict), eslint with the React Compiler rules,
  prettier, knip, Redocly; `make check` runs what CI runs.
- **Image.** A static binary on distroless, running as nonroot.
- **Agent guidance.** `AGENTS.md` and `web/AGENTS.md` describe the layout and
  rules; `.agents/skills/` holds task skills (also visible to Claude Code
  through `.claude/skills`).

## Quick start

Needs Go 1.26 and golangci-lint 2.12 (`.tool-versions`), and node 24 with
pnpm 11 (pinned through volta in `package.json`).

```bash
pnpm install
make build WEB=1                  # UI embedded in build/bin/skeletond
build/bin/skeletond               # http://127.0.0.1:8080
```

| Flag | Default | |
| --- | --- | --- |
| `-listen` | `127.0.0.1:8080` | HTTP address: API and UI |

For UI work, run `make run` in one terminal and `pnpm --dir web dev` in another,
then open http://localhost:5173. Vite proxies `/api/` to the daemon. Components
and pages also render in Storybook with mocked API responses: `make storybook`,
then http://localhost:6006. Story tests need Playwright's Chromium
(`pnpm --dir web exec playwright install chromium`).

`make help` lists every target. `make check` runs what CI runs.

## Renaming

The name appears in: `go.mod` (module path, then every import), `cmd/skeletond`
(directory, `main.go`, `Makefile`, `Dockerfile`, `.github/workflows/ci.yml`),
`api/openapi.yaml` (title), `package.json` and `web/package.json` (names),
`web/index.html` (title), `web/src/components/Layout/AppShell/AppShell.tsx` and
its test (product name), `web/src/routes/index.tsx` (head title), and the
`.golangci.yml` import prefix. `AGENTS.md`, `web/AGENTS.md`, this README and
`.agents/skills/web-page/SKILL.md` mention it in prose.

## Layout

```
api/                    openapi.yaml, ogen config; rest/ is generated
cmd/skeletond/          entry point: flags, wiring, shutdown
internal/server/        ogen operations, SSE stream, problems, then the UI
internal/ui/            serves the embedded single-page app
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
  the interface they need on their side.
