// Package ui serves the embedded web frontend as a single-page app.
package ui

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"io/fs"
	"log/slog"
	"net/http"
	"path"
	"strings"
	"time"
)

// Placeholder is the comment in index.html that Handler replaces with the
// injected configuration. Without it the page is served as built.
const Placeholder = "<!--config-->"

// policy is the Content-Security-Policy of everything the handler serves:
// the app's own scripts, styles, images and API, nothing inline, no plugins,
// no <base>, no framing. The page adds the injected script by its hash.
const policy = "default-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"

// Config returns the public configuration as JSON, for injection into
// index.html as window.__CONFIG__. The UI seeds its query cache from it, so
// the first render does not wait for a request. The same JSON is served by
// the API's getConfig operation.
type Config func() ([]byte, error)

// Handler serves files from assets and falls back to index.html for any
// other non-API path, so client-side routes work on reload. Paths under
// /api/ are never answered with the app, and neither is a path that names a
// file (it has an extension): a missing asset is a 404, not the app.
//
// config may be nil; when it fails, the page is served without injection and
// the UI fetches the configuration instead.
func Handler(log *slog.Logger, assets fs.FS, config Config) (http.Handler, error) {
	index, err := fs.ReadFile(assets, "index.html")
	if err != nil {
		return nil, fmt.Errorf("read index.html: %w", err)
	}

	return &handler{log: log, assets: assets, index: index, config: config}, nil
}

type handler struct {
	log    *slog.Logger
	assets fs.FS
	index  []byte
	config Config
}

func (h *handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Security-Policy", policy)

	p := path.Clean(r.URL.Path)
	if p == "/api" || strings.HasPrefix(p, "/api/") {
		http.NotFound(w, r)

		return
	}

	name := strings.TrimPrefix(p, "/")
	if name == "" || name == "index.html" {
		h.serveIndex(w, r)

		return
	}

	f, err := h.assets.Open(name)
	if err != nil {
		if path.Ext(name) != "" {
			http.NotFound(w, r)

			return
		}

		h.serveIndex(w, r)

		return
	}
	defer func() { _ = f.Close() }()

	stat, err := f.Stat()
	if err != nil || stat.IsDir() {
		h.serveIndex(w, r)

		return
	}

	rs, ok := f.(io.ReadSeeker)
	if !ok {
		http.Error(w, "internal error", http.StatusInternalServerError)

		return
	}

	// Vite fingerprints everything under assets/, so those never change.
	if strings.HasPrefix(name, "assets/") {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	}

	http.ServeContent(w, r, stat.Name(), stat.ModTime(), rs)
}

func (h *handler) serveIndex(w http.ResponseWriter, r *http.Request) {
	page, script := h.page(r)
	if script != "" {
		w.Header().Set("Content-Security-Policy", policy+"; script-src 'self' "+scriptHash(script))
	}

	w.Header().Set("Cache-Control", "no-cache")
	http.ServeContent(w, r, "index.html", time.Time{}, bytes.NewReader(page))
}

// page is index.html with the configuration injected, and the injected
// script's source; or the page as built and "" when there is nothing to
// inject or the configuration is unavailable.
func (h *handler) page(r *http.Request) ([]byte, string) {
	if h.config == nil || !bytes.Contains(h.index, []byte(Placeholder)) {
		return h.index, ""
	}

	cfg, err := h.config()
	if err != nil {
		h.log.ErrorContext(r.Context(), "cannot inject the configuration; the UI will fetch it", "error", err)

		return h.index, ""
	}

	return Inject(h.index, cfg), configScript(cfg)
}

// Inject replaces Placeholder in page with a script that sets
// window.__CONFIG__ to configJSON.
func Inject(page, configJSON []byte) []byte {
	return bytes.Replace(page, []byte(Placeholder), []byte("<script>"+configScript(configJSON)+"</script>"), 1)
}

// configScript is the source of the script that sets window.__CONFIG__. The
// JSON is made safe for a script block: <, > and & become \u escapes, which
// JSON strings allow.
func configScript(configJSON []byte) string {
	safe := string(configJSON)
	for from, to := range map[string]string{"<": `\u003c`, ">": `\u003e`, "&": `\u0026`} {
		safe = strings.ReplaceAll(safe, from, to)
	}

	return "window.__CONFIG__=" + safe + ";"
}

// scriptHash is the CSP source that allows the inline script whose source is
// script, and no other: 'sha256-<base64 digest>'.
func scriptHash(script string) string {
	sum := sha256.Sum256([]byte(script))

	return "'sha256-" + base64.StdEncoding.EncodeToString(sum[:]) + "'"
}
