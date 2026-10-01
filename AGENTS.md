# skeleton

`skeletond` serves a spec-first HTTP API and an embedded React UI from one
binary. [README.md](README.md) maps each part to its files. Before frontend
work, read [web/AGENTS.md](web/AGENTS.md).

## Commands

Run `pnpm install` at the repo root first. `make help` lists every target.

```bash
make lint test      # both sides; lint-go/test-go or lint-web/test-web for one, lint-api for the spec
make generate       # regenerate api/rest and web/src/api from api/openapi.yaml
make check          # lint, generate-check, test, govulncheck, tidy-check
make fmt            # gofumpt, goimports, prettier
make run            # build and serve on 127.0.0.1:8080 with whatever web/dist holds
make build WEB=1    # build the binary with the real UI embedded
```

- Before finishing, run `make lint-<side> test-<side>` for each side you
  touched.
- `make generate-check` compares generated code with git, so it fails until
  regenerated code is committed.
- Run Go through `make`. Run directly, Go needs `GOWORK=off` and a `web/dist`
  for `web/embed.go`: `make web-placeholder` creates a stub. Never commit
  `web/dist`.

## Layout

- One package under `internal/` per concern. It owns its goroutines, takes an
  injected `*slog.Logger` and returns concrete types; each consumer declares
  the small interface it needs.
- A decision that should be a pure function of its inputs (a policy, a
  planner, a reducer) goes under `pkg/`. Lint and the boundary test keep `pkg/`
  free of `internal/`, `api/`, `net/http`, `database/sql`, the process clock
  and `rand`: pass time and randomness in.
- To restrict who may import a package, add an entry to `boundaries` in
  `internal/testutil/importguard/boundary_test.go`, and a `depguard` rule in
  `.golangci.yml` when lint-time feedback helps.

## API

- `api/openapi.yaml` is the source of truth. `api/rest/` (ogen server) and
  `web/src/api/` (hey-api client, types, Zod schemas) are generated from it:
  never edit them; commit them.
- To add or change an operation: edit the spec, run `make generate`, then
  implement the method on `operations` in `internal/server` (the build fails
  until it exists), with a Go test.
- Paths live under `/api/v1/`; JSON fields are camelCase. Every operation's
  `default` response is the RFC 9457 `Problem`. A handler returns
  `problem(status, detail)` as its error for a client error; any other error
  is logged and answered as a 500.
- ogen cannot serve `text/event-stream`, so an event stream is declared in the
  spec and hand-routed in `internal/server/server.go`. `TestEveryOperationIsServed`
  fails until every operation is served with its declared content type. To add
  an event: add its schema to the stream's response in the spec, send it from
  `internal/server/stream.go`, and handle it in `web/src/hooks/useEventStream`.
- `getConfig` is public and injected into `index.html`: nothing in it may be a
  secret or need authentication.
- Times in the API are UTC (`.UTC()`); the client's Zod schemas reject offsets.

## Go

- Use the injected logger and its `…Context` methods when a context is in
  scope (sloglint). A request's context adds its ID to every line; never log
  the ID by hand.
- Where a test needs to control time, read it from an injected clock
  (`Config.Now`), never `time.Now`.

## Rules

- Fix lint findings rather than suppressing them. A suppression covers one
  line, names the rule and says why: `//nolint:<linter> // why`,
  `// eslint-disable-next-line <rule> -- why`. Unused ones fail lint.
- Skills for repeated tasks live in `.agents/skills/` (`.claude/skills` links
  there). Add a page with [web-page](.agents/skills/web-page/SKILL.md).
