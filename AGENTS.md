# skeleton

A Go daemon (`skeletond`) that serves a spec-first HTTP API and an embedded
React UI from one binary. It is a starting point: replace the health endpoint
and the home page with your domain, keep the layout and the rules.

This repo contains:

- `api/openapi.yaml`: the HTTP API, and the source of truth for both sides.
  `api/rest/` is the ogen-generated server; never edit it.
- `cmd/skeletond`: the daemon entry point: flags, wiring, shutdown
- `internal/server`: the ogen operations, hand-routed event streams, problems,
  the UI mount
- `internal/ui`: serves the embedded single-page app
- `internal/testutil/importguard`: lists packages and imports for boundary
  tests; `boundary_test.go` there is the repository's dependency rules
- `web/`: the UI (Vite, React, TanStack). Read [web/AGENTS.md](web/AGENTS.md)
  before frontend work.

Add a package under `internal/` per concern as the domain grows. Each
package owns its goroutines, takes an injected `*slog.Logger`, and exposes a
small interface that its consumers define on their side. A decision that
should be a pure function of its inputs (a policy, a planner, a reducer) goes
under `pkg/`: lint and the boundary test keep `pkg/` free of the application,
transport, storage, the process clock and randomness, so it replays exactly.

## Commands

Run `pnpm install` once at the repo root before any frontend command.

```bash
make check            # everything CI runs: lint, generate-check, tests, govulncheck, tidy-check
make audit            # check, then rebuild the UI and the binary with it embedded
make generate         # regenerate api/rest and web/src/api after editing api/openapi.yaml
make test-go          # go test -race ./...
make lint-go          # golangci-lint
make fmt              # gofumpt/goimports and prettier
make run              # build and serve on 127.0.0.1:8080 (placeholder UI)
make build WEB=1      # embed the real UI
make image            # the container image
pnpm --dir web dev    # Vite on :5173, proxying /api/ to a running skeletond
make storybook        # component explorer on :6006
```

## Rules

- Go always runs with `GOWORK=off` (the Makefile sets it); a parent `go.work`
  must never apply.
- `web/embed.go` embeds `web/dist`. Go targets create a placeholder when it is
  missing. Never commit `web/dist`.
- The API is spec first. To add or change an operation: edit
  `api/openapi.yaml`, run `make generate`, then implement the generated method
  on `operations` in `internal/server` (the build fails until you do) with a
  Go test. The web client, types and Zod schemas update from the same spec.
  Commit generated code; CI fails when it is stale.
- ogen cannot serve `text/event-stream`. An SSE operation is declared in the
  spec and hand-routed in `internal/server/server.go`;
  `TestEveryOperationIsServed` fails if any operation is not served.
- Routes live under `/api/v1/`; JSON fields are camelCase; errors are RFC 9457
  problems (`application/problem+json`).
- Loggers are injected `*slog.Logger`s, never the global one; use the
  `…Context` methods when a context is in scope (`sloglint` enforces both).
  Inside a request that context carries the request ID, and the server's
  logger adds it to every line, so never log the ID by hand.
- Time is injected where a test needs to control it (`Config.Now`), never
  read from `time.Now` inside a handler. Times in the API are UTC: the
  generated client's Zod schemas accept only the `Z` suffix.
- Dependency boundaries are tests, not review notes. When a package must not
  be imported outside a few places, add a line to `boundaries` in
  `internal/testutil/importguard/boundary_test.go`; mirror it in
  `.golangci.yml`'s `depguard` when lint-time feedback helps.
- Fix lint findings rather than suppressing them. A `//nolint` names the linter
  and says why.
- Skills for repeated tasks live in `.agents/skills/` (also visible to Claude
  Code through `.claude/skills`). Use [web-page](.agents/skills/web-page/SKILL.md)
  to add a page.
