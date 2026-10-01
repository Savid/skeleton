.DEFAULT_GOAL := help
.PHONY: help build image run check audit lint lint-go lint-web lint-api generate generate-check vuln tidy-check fmt test test-go test-web storybook install-frontend build-web web-assets web-placeholder clean

BIN_DIR ?= build/bin
VERSION ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo dev)
# GOWORK=off: never pick up a go.work from a parent directory.
GO := GOWORK=off go
GO_BUILD := GOWORK=off CGO_ENABLED=0 go build -trimpath -ldflags="-s -w -X main.version=$(VERSION)"
LISTEN ?= 127.0.0.1:8080

# `make build` and `make run` embed a placeholder UI unless WEB=1, so Go work
# never waits on the frontend. CI and releases build the real one.
WEB ?= 0

## help: list targets
help:
	@sed -n 's/^## //p' $(MAKEFILE_LIST)

## build: compile skeletond into build/bin (WEB=1 embeds the real UI)
build: web-assets
	$(GO_BUILD) -o $(BIN_DIR)/skeletond ./cmd/skeletond

## image: build the skeleton:local container image (UI embedded)
image:
	docker build -t skeleton:local --build-arg VERSION=$(VERSION) .

## run: build and start skeletond on LISTEN (default 127.0.0.1:8080)
run: build
	$(BIN_DIR)/skeletond -listen $(LISTEN)

## check: lint, generated-code check, tests, govulncheck and tidy check
check: lint generate-check test vuln tidy-check

## audit: check, then build the real UI and embed it
audit: check build-web
	$(GO_BUILD) -o $(BIN_DIR)/skeletond ./cmd/skeletond

## lint: golangci-lint; eslint, tsc, prettier and knip; Redocly on the spec
lint: lint-go lint-web lint-api

lint-go: web-placeholder
	GOWORK=off golangci-lint run ./...

lint-web: install-frontend
	pnpm --dir web lint
	pnpm --dir web typecheck
	pnpm --dir web format:check
	pnpm knip

lint-api: install-frontend
	pnpm lint:api

## generate: regenerate api/rest (ogen) and web/src/api (hey-api) from api/openapi.yaml
generate: install-frontend
	$(GO) generate ./api/...
	pnpm --dir web generate:api

## generate-check: fail if committed generated code differs from the spec's output
generate-check: generate
	@test -z "$$(git status --porcelain -- api/rest web/src/api)" || \
		{ git status --short -- api/rest web/src/api; echo "generated code is stale: run make generate and commit it"; exit 1; }

## vuln: report known vulnerabilities in the Go dependency graph
vuln: web-placeholder
	$(GO) tool govulncheck ./...

## tidy-check: fail if go.mod or go.sum would change under go mod tidy
tidy-check: web-placeholder
	$(GO) mod tidy -diff
	$(GO) mod verify

## fmt: format Go and web sources
fmt:
	GOWORK=off golangci-lint fmt ./...
	pnpm --dir web format

## test: Go tests, web unit tests, and every story as a browser test in each theme
test: test-go test-web

test-go: web-placeholder
	$(GO) test -race ./...

test-web: install-frontend
	pnpm --dir web test

## storybook: component explorer on http://localhost:6006
storybook: install-frontend
	pnpm --dir web storybook

## install-frontend: install pinned web dependencies
install-frontend:
	pnpm install --frozen-lockfile

## build-web: build the UI into web/dist
build-web: install-frontend
	pnpm --dir web build

web-assets:
ifeq ($(WEB),1)
	@$(MAKE) --no-print-directory build-web
else
	@$(MAKE) --no-print-directory web-placeholder
endif

# web/embed.go needs web/dist to exist. Keep a real build if there is one.
web-placeholder:
	@mkdir -p web/dist
	@test -f web/dist/index.html || printf '%s\n' '<!doctype html><html><head><title>skeleton</title></head><body><p>UI not built. Run <code>make build WEB=1</code>, or <code>pnpm --dir web dev</code>.</p></body></html>' > web/dist/index.html

## clean: remove build output
clean:
	rm -rf build web/dist
