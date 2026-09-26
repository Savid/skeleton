# syntax=docker/dockerfile:1

# Web UI: built first so the Go binary can embed it.
FROM node:24.19.0-bookworm-slim AS web
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /src
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web/package.json web/
RUN pnpm install --frozen-lockfile
COPY web/ web/
RUN pnpm --dir web build

FROM golang:1.27.1 AS go
WORKDIR /src
COPY go.mod go.sum ./
RUN GOWORK=off go mod download
COPY api/ api/
COPY cmd/ cmd/
COPY internal/ internal/
COPY web/embed.go web/
COPY --from=web /src/web/dist web/dist
ARG VERSION=dev
RUN GOWORK=off CGO_ENABLED=0 go build -trimpath -ldflags="-s -w -X main.version=${VERSION}" -o /out/skeletond ./cmd/skeletond

# Static binary on distroless, running as nonroot.
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=go /out/skeletond /usr/local/bin/skeletond
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/skeletond"]
CMD ["-listen", "0.0.0.0:8080"]
