# syntax=docker/dockerfile:1.29.0@sha256:572cebbc2b15e6f84c077742952674889cb63cd5e9b80abdffcbe587b6f19183

# Images, this frontend included, are pinned by tag and digest, as the CI
# actions are by commit. Dependabot proposes the base images' bumps weekly;
# the Go and pnpm versions, and this frontend, are bumped by hand with their
# other pins. `docker buildx imagetools inspect <image>:<tag>` prints a digest.

# The web and go stages run on the build machine whatever the target: the UI
# is the same files everywhere and Go cross-compiles, so building for another
# architecture needs no emulation.

# Web UI: built first so the Go binary can embed it. The pnpm image holds a
# standalone pnpm and no Node; pnpm installs the Node that package.json pins
# (devEngines, checksummed in pnpm-lock.yaml) and runs the build with it.
FROM --platform=$BUILDPLATFORM ghcr.io/pnpm/pnpm:12.23.0@sha256:349c846c6c9dab76b2f6fbf4b2df14d5a8c9b2a0fce92fc7e5c2eec3f437e801 AS web
WORKDIR /src
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web/package.json web/
# The store, and pnpm's cache of lockfile checks, persist between builds.
RUN --mount=type=cache,id=skeleton-pnpm-store,target=/var/cache/pnpm \
    --mount=type=cache,id=skeleton-pnpm-cache,target=/root/.cache/pnpm \
    pnpm install --frozen-lockfile --store-dir /var/cache/pnpm
COPY web/ web/
RUN pnpm --dir web build

FROM --platform=$BUILDPLATFORM golang:1.27.4-trixie@sha256:430985542100b871e108ccc00e8dcc5eef08ca14ee5825e98ebf563d8ffec4ee AS go
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
ARG TARGETOS TARGETARCH
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    GOWORK=off CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -trimpath -ldflags="-s -w -X main.version=${VERSION}" -o /out/skeletond ./cmd/skeletond

# Static binary on distroless, running as nonroot.
FROM gcr.io/distroless/static-debian13:nonroot@sha256:8ce6dd87e9823c5b48dcfb2c8604714ccb351ce59607327bcc4957448da279b5
COPY --from=go /out/skeletond /usr/local/bin/skeletond
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/skeletond"]
CMD ["-listen", "0.0.0.0:8080"]
