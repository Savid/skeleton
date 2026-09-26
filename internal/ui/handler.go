// Package ui serves the embedded web frontend as a single-page app.
package ui

import (
	"bytes"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"path"
	"strings"
	"time"
)

// Handler serves files from assets and falls back to index.html for any
// other non-API path, so client-side routes work on reload. Paths under
// /api/ are never answered with the app, and neither is a path that names a
// file (it has an extension): a missing asset is a 404, not the app.
func Handler(assets fs.FS) (http.Handler, error) {
	index, err := fs.ReadFile(assets, "index.html")
	if err != nil {
		return nil, fmt.Errorf("read index.html: %w", err)
	}

	return &handler{assets: assets, index: index}, nil
}

type handler struct {
	assets fs.FS
	index  []byte
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
	http.ServeContent(w, r, "index.html", time.Time{}, bytes.NewReader(h.index))
}
