// Package api holds the OpenAPI spec, the source of truth for the HTTP API.
// The server code in api/rest is generated from it; so is the web client in
// web/src/api (pnpm --dir web generate:api).
package api

//go:generate go tool ogen -config ogen.yml -target rest -package rest -clean openapi.yaml
