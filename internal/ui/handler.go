// Package ui serves the embedded web frontend as a single-page app.
package ui

import (
	"bytes"
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
	w.Header().Set("Cache-Control", "no-cache")
	http.ServeContent(w, r, "index.html", time.Time{}, bytes.NewReader(h.page(r)))
}

// page is index.html with the configuration injected, or as built when there
// is nothing to inject or the configuration is unavailable.
func (h *handler) page(r *http.Request) []byte {
	if h.config == nil || !bytes.Contains(h.index, []byte(Placeholder)) {
		return h.index
	}

	cfg, err := h.config()
	if err != nil {
		h.log.ErrorContext(r.Context(), "cannot inject the configuration; the UI will fetch it", "error", err)

		return h.index
	}

	return Inject(h.index, cfg)
}

// Inject replaces Placeholder in page with a script that sets
// window.__CONFIG__ to configJSON. The JSON is made safe for a script
// block: <, > and & become \u escapes, which JSON strings allow.
func Inject(page, configJSON []byte) []byte {
	safe := string(configJSON)
	for from, to := range map[string]string{"<": `\u003c`, ">": `\u003e`, "&": `\u0026`} {
		safe = strings.ReplaceAll(safe, from, to)
	}

	script := "<script>window.__CONFIG__=" + safe + ";</script>"

	return bytes.Replace(page, []byte(Placeholder), []byte(script), 1)
}
