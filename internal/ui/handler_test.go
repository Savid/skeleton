package ui

import (
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"
)

const indexHTML = "<!doctype html><html><head><title>app</title><!--config--></head><body></body></html>"

var testAssets = fstest.MapFS{
	"index.html":       {Data: []byte(indexHTML)},
	"assets/app-1.js":  {Data: []byte("console.log(1)")},
	"favicon.svg":      {Data: []byte("<svg/>")},
	"assets/nested/.x": {Data: []byte("x")},
}

func staticConfig(json string) Config {
	return func() ([]byte, error) { return []byte(json), nil }
}

func TestHandler(t *testing.T) {
	t.Parallel()

	h, err := Handler(slog.New(slog.DiscardHandler), testAssets, staticConfig(`{"name":"app"}`))
	if err != nil {
		t.Fatal(err)
	}

	injected := `<script>window.__CONFIG__={"name":"app"};</script>`

	tests := []struct {
		name, path string
		status     int
		body       string
		cache      string
	}{
		{name: "root serves index with config", path: "/", status: http.StatusOK, body: injected, cache: "no-cache"},
		{name: "client route falls back to index", path: "/sessions/42", status: http.StatusOK, body: injected, cache: "no-cache"},
		{name: "directory falls back to index", path: "/assets/nested", status: http.StatusOK, body: "<title>app</title>", cache: "no-cache"},
		{name: "fingerprinted asset is immutable", path: "/assets/app-1.js", status: http.StatusOK, body: "console.log(1)", cache: "public, max-age=31536000, immutable"},
		{name: "static file", path: "/favicon.svg", status: http.StatusOK, body: "<svg/>"},
		{name: "missing file is not the app", path: "/favicon.ico", status: http.StatusNotFound},
		{name: "missing nested file is not the app", path: "/assets/gone.js", status: http.StatusNotFound},
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
			if tt.status == http.StatusOK && strings.Contains(tt.body, "<title>") && strings.Contains(rec.Body.String(), Placeholder) {
				t.Fatal("placeholder left in the page")
			}
		})
	}
}

// Without a placeholder, or when the configuration fails, the page is served
// as built and the UI fetches the configuration itself.
func TestHandlerServesPageWithoutConfig(t *testing.T) {
	t.Parallel()

	plain := fstest.MapFS{"index.html": {Data: []byte("<!doctype html><html><head></head></html>")}}

	for name, tc := range map[string]struct {
		assets fstest.MapFS
		config Config
	}{
		"no placeholder": {plain, staticConfig(`{}`)},
		"no config":      {testAssets, nil},
		"config fails":   {testAssets, func() ([]byte, error) { return nil, errors.New("not ready") }},
	} {
		t.Run(name, func(t *testing.T) {
			t.Parallel()

			h, err := Handler(slog.New(slog.DiscardHandler), tc.assets, tc.config)
			if err != nil {
				t.Fatal(err)
			}

			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, httptest.NewRequestWithContext(t.Context(), http.MethodGet, "/", nil))

			want := string(tc.assets["index.html"].Data)
			if rec.Code != http.StatusOK || rec.Body.String() != want {
				t.Fatalf("got %d %q, want the page as built", rec.Code, rec.Body.String())
			}
		})
	}
}

// A value that could close the script block is escaped, and JSON still
// parses it to the original string.
func TestInjectEscapesScriptBreakers(t *testing.T) {
	t.Parallel()

	got := string(Inject([]byte(indexHTML), []byte(`{"name":"</script><b>&"}`)))

	if strings.Contains(got, "</script><b>") {
		t.Fatalf("script block can be closed: %s", got)
	}

	if !strings.Contains(got, `window.__CONFIG__={"name":"\u003c/script\u003e\u003cb\u003e\u0026"};`) {
		t.Fatalf("injected %s", got)
	}
}

func TestHandlerRequiresIndex(t *testing.T) {
	t.Parallel()

	if _, err := Handler(slog.New(slog.DiscardHandler), fstest.MapFS{}, nil); err == nil {
		t.Fatal("want an error without index.html")
	}
}
