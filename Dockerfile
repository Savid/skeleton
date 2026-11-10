# syntax=docker/dockerfile:1

# Web UI: built first so the Go binary can embed it.
FROM node:26.13.0-trixie-slim AS web
# Node 25+ ships without corepack; take pnpm from its official image.
COPY --from=ghcr.io/pnpm/pnpm:12.18.0 /opt/pnpm /opt/pnpm
RUN ln -s /opt/pnpm/pnpm /usr/local/bin/pnpm
WORKDIR /src
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web/package.json web/
RUN --mount=type=cache,id=pnpm,target=/var/cache/pnpm \
    pnpm install --frozen-lockfile --store-dir /var/cache/pnpm
COPY web/ web/
RUN pnpm --dir web build

FROM golang:1.27.4 AS go
WORKDIR /src
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    GOWORK=off go mod download
COPY api/ api/
COPY cmd/ cmd/
COPY internal/ internal/
COPY web/embed.go web/
COPY --from=web /src/web/dist web/dist
ARG VERSION=dev
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    GOWORK=off CGO_ENABLED=0 go build -trimpath -ldflags="-s -w -X main.version=${VERSION}" -o /out/skeletond ./cmd/skeletond

# Static binary on distroless, running as nonroot.
FROM gcr.io/distroless/static-debian13:nonroot
COPY --from=go /out/skeletond /usr/local/bin/skeletond
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/skeletond"]
CMD ["-listen", "0.0.0.0:8080"]
