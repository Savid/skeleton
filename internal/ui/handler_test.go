package ui

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"
)

func TestHandler(t *testing.T) {
	t.Parallel()

	h, err := Handler(fstest.MapFS{
		"index.html":       {Data: []byte("<!doctype html><title>app</title>")},
		"assets/app-1.js":  {Data: []byte("console.log(1)")},
		"favicon.svg":      {Data: []byte("<svg/>")},
		"assets/nested/.x": {Data: []byte("x")},
	})
	if err != nil {
		t.Fatal(err)
	}

	tests := []struct {
		name, path string
		status     int
		body       string
		cache      string
	}{
		{name: "root serves index", path: "/", status: http.StatusOK, body: "<title>app</title>", cache: "no-cache"},
		{name: "client route falls back to index", path: "/sessions/42", status: http.StatusOK, body: "<title>app</title>", cache: "no-cache"},
		{name: "directory falls back to index", path: "/assets/nested", status: http.StatusOK, body: "<title>app</title>", cache: "no-cache"},
		{name: "fingerprinted asset is immutable", path: "/assets/app-1.js", status: http.StatusOK, body: "console.log(1)", cache: "public, max-age=31536000, immutable"},
		{name: "static file", path: "/favicon.svg", status: http.StatusOK, body: "<svg/>"},
		{name: "unknown api path is not the app", path: "/api/v1/missing", status: http.StatusNotFound},
		{name: "api root is not the app", path: "/api", status: http.StatusNotFound},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, httptest.NewRequestWithContext(t.Context(), http.MethodGet, tt.path, nil))

			if rec.Code != tt.status {
				t.Fatalf("status = %d, want %d", rec.Code, tt.status)
			}
			if tt.body != "" && !strings.Contains(rec.Body.String(), tt.body) {
				t.Fatalf("body = %q, want it to contain %q", rec.Body.String(), tt.body)
			}
			if got := rec.Header().Get("Cache-Control"); got != tt.cache {
				t.Fatalf("Cache-Control = %q, want %q", got, tt.cache)
			}
		})
	}
}

func TestHandlerRequiresIndex(t *testing.T) {
	t.Parallel()

	if _, err := Handler(fstest.MapFS{}); err == nil {
		t.Fatal("expected an error without index.html")
	}
}
