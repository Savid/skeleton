package server

import (
	"context"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"
	"time"

	"github.com/savid/skeleton/api/rest"
)

var testAssets = fstest.MapFS{"index.html": {Data: []byte("<!doctype html><html><head><title>app</title><!--config--></head></html>")}}

// testNow is in a local zone on purpose: the API must answer in UTC.
var testNow = time.Date(2026, 9, 26, 22, 0, 0, 0, time.FixedZone("AEST", 10*3600))

func newTestServer(t *testing.T) *Server {
	t.Helper()

	cfg := Config{
		// httptest requests are addressed to example.com.
		Listen: "127.0.0.1:0", AllowedHosts: []string{"example.com"},
		Name: "app", Version: "test", StreamInterval: 10 * time.Millisecond,
		Now: func() time.Time { return testNow },
	}

	s, err := New(slog.New(slog.DiscardHandler), cfg, testAssets)
	if err != nil {
		t.Fatal(err)
	}

	return s
}

func get(t *testing.T, h http.Handler, method, path string) *httptest.ResponseRecorder {
	t.Helper()

	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequestWithContext(t.Context(), method, path, nil))

	return rec
}

func TestHealth(t *testing.T) {
	t.Parallel()

	rec := get(t, newTestServer(t).Handler(), http.MethodGet, "/api/v1/health")

	var body rest.Health
	if err := body.UnmarshalJSON(rec.Body.Bytes()); err != nil {
		t.Fatal(err)
	}

	if rec.Code != http.StatusOK || body.Status != rest.HealthStatusOk || body.Version != "test" || !body.At.Equal(testNow) {
		t.Fatalf("GET /api/v1/health = %d %+v", rec.Code, body)
	}

	// The generated web client accepts only UTC date-times.
	if !strings.Contains(rec.Body.String(), `"at":"2026-09-26T12:00:00Z"`) {
		t.Errorf("health is not in UTC: %s", rec.Body.String())
	}
}

func TestRoutes(t *testing.T) {
	t.Parallel()

	h := newTestServer(t).Handler()
	for _, tc := range []struct {
		method, path string
		status       int
		contentType  string
	}{
		{http.MethodGet, "/", http.StatusOK, "text/html; charset=utf-8"},
		{http.MethodGet, "/some/client/route", http.StatusOK, "text/html; charset=utf-8"},
		{http.MethodGet, "/openapi.yaml", http.StatusOK, "application/yaml"},
		{http.MethodGet, "/api/v1/missing", http.StatusNotFound, "application/problem+json"},
		{http.MethodPost, "/api/v1/health", http.StatusMethodNotAllowed, "application/problem+json"},
	} {
		rec := get(t, h, tc.method, tc.path)
		if rec.Code != tc.status || rec.Header().Get("Content-Type") != tc.contentType {
			t.Errorf("%s %s = %d %q, want %d %q", tc.method, tc.path,
				rec.Code, rec.Header().Get("Content-Type"), tc.status, tc.contentType)
		}
	}
}

// The configuration is served by the API and injected into the page, byte
// for byte the same.
func TestConfigServedAndInjected(t *testing.T) {
	t.Parallel()

	h := newTestServer(t).Handler()

	rec := get(t, h, http.MethodGet, "/api/v1/config")

	var cfg rest.Config
	if err := cfg.UnmarshalJSON(rec.Body.Bytes()); err != nil {
		t.Fatal(err)
	}

	if rec.Code != http.StatusOK || cfg.Name != "app" || cfg.Version != "test" {
		t.Fatalf("GET /api/v1/config = %d %+v", rec.Code, cfg)
	}

	page := get(t, h, http.MethodGet, "/some/client/route").Body.String()
	if want := "<script>window.__CONFIG__=" + rec.Body.String() + ";</script>"; !strings.Contains(page, want) {
		t.Fatalf("page %q lacks %q", page, want)
	}
}

// Every response carries a request ID, which a proxy in front may supply.
func TestResponsesCarryRequestID(t *testing.T) {
	t.Parallel()

	rec := get(t, newTestServer(t).Handler(), http.MethodGet, "/api/v1/health")
	if rec.Header().Get(requestIDHeader) == "" {
		t.Error("health response has no request ID")
	}
}

func TestProblemBody(t *testing.T) {
	t.Parallel()

	rec := get(t, newTestServer(t).Handler(), http.MethodGet, "/api/v1/missing")

	var p rest.Problem
	if err := p.UnmarshalJSON(rec.Body.Bytes()); err != nil {
		t.Fatal(err)
	}

	if p.Status != http.StatusNotFound || p.Title != "Not Found" || p.Detail.Value != "no such API route" {
		t.Errorf("problem = %+v", p)
	}
}

// send serves one request built by build on h.
func send(t *testing.T, h http.Handler, build func(r *http.Request)) *httptest.ResponseRecorder {
	t.Helper()

	req := httptest.NewRequestWithContext(t.Context(), http.MethodGet, "/", nil)
	build(req)

	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	return rec
}

// Every response carries the security headers: the API's, the spec's, the
// page's, a HEAD's, the stream's, a problem's and each kind of refusal.
func TestSecurityHeaders(t *testing.T) {
	t.Parallel()

	h := newTestServer(t).Handler()
	want := map[string]string{
		"X-Content-Type-Options":       "nosniff",
		"Referrer-Policy":              "same-origin",
		"X-Frame-Options":              "DENY",
		"Cross-Origin-Opener-Policy":   "same-origin",
		"Cross-Origin-Resource-Policy": "same-origin",
	}

	cancelled, cancel := context.WithCancel(t.Context())
	cancel()

	for name, tc := range map[string]struct {
		build  func(r *http.Request)
		status int
		page   bool
	}{
		"api":     {func(r *http.Request) { r.URL.Path = "/api/v1/health" }, http.StatusOK, false},
		"spec":    {func(r *http.Request) { r.URL.Path = "/openapi.yaml" }, http.StatusOK, false},
		"page":    {func(*http.Request) {}, http.StatusOK, true},
		"head":    {func(r *http.Request) { r.Method = http.MethodHead }, http.StatusOK, true},
		"problem": {func(r *http.Request) { r.URL.Path = "/api/v1/missing" }, http.StatusNotFound, false},
		"stream": {func(r *http.Request) {
			*r = *r.WithContext(cancelled)
			r.URL.Path = "/api/v1/stream"
		}, http.StatusOK, false},
		"cross-origin refusal": {func(r *http.Request) {
			r.Method = http.MethodPost
			r.Header.Set("Sec-Fetch-Site", "cross-site")
		}, http.StatusForbidden, false},
		"host refusal": {func(r *http.Request) { r.Host = "rebound.example" }, http.StatusForbidden, false},
	} {
		t.Run(name, func(t *testing.T) {
			t.Parallel()

			rec := send(t, h, tc.build)
			if rec.Code != tc.status {
				t.Fatalf("status = %d, want %d", rec.Code, tc.status)
			}

			for header, value := range want {
				if got := rec.Header().Get(header); got != value {
					t.Errorf("%s = %q, want %q", header, got, value)
				}
			}

			// The page has its own policy; everything else gets one that allows nothing.
			csp := rec.Header().Get("Content-Security-Policy")
			if tc.page != strings.HasPrefix(csp, "default-src 'self'") || !tc.page && !strings.HasPrefix(csp, "default-src 'none'") {
				t.Errorf("Content-Security-Policy = %q", csp)
			}
		})
	}
}

// A browser's cross-origin write is refused with a problem before routing; a
// same-origin or non-browser one reaches the API (which has no writes yet,
// so it answers 405), and reads pass from anywhere. Without Sec-Fetch-Site
// (plain HTTP to anything but localhost), Origin is compared with Host.
func TestCrossOriginWritesRefused(t *testing.T) {
	t.Parallel()

	h := newTestServer(t).Handler()

	for name, tc := range map[string]struct {
		method, site, origin string
		status               int
	}{
		"cross-site write":         {http.MethodPost, "cross-site", "", http.StatusForbidden},
		"same-site write":          {http.MethodPost, "same-site", "", http.StatusForbidden},
		"same-origin write":        {http.MethodPost, "same-origin", "", http.StatusMethodNotAllowed},
		"not a browser":            {http.MethodPost, "", "", http.StatusMethodNotAllowed},
		"origin matches host":      {http.MethodPost, "", "http://example.com", http.StatusMethodNotAllowed},
		"origin differs from host": {http.MethodPost, "", "http://evil.example", http.StatusForbidden},
		"null origin":              {http.MethodPost, "", "null", http.StatusForbidden},
		"cross-site read":          {http.MethodGet, "cross-site", "", http.StatusOK},
	} {
		t.Run(name, func(t *testing.T) {
			t.Parallel()

			rec := send(t, h, func(r *http.Request) {
				r.Method = tc.method
				r.URL.Path = "/api/v1/health"

				if tc.site != "" {
					r.Header.Set("Sec-Fetch-Site", tc.site)
				}

				if tc.origin != "" {
					r.Header.Set("Origin", tc.origin)
				}
			})

			if rec.Code != tc.status {
				t.Fatalf("%s (Sec-Fetch-Site %q, Origin %q) = %d, want %d", tc.method, tc.site, tc.origin, rec.Code, tc.status)
			}

			if tc.status == http.StatusForbidden && rec.Header().Get("Content-Type") != "application/problem+json" {
				t.Errorf("refusal Content-Type = %q, want application/problem+json", rec.Header().Get("Content-Type"))
			}
		})
	}
}

// A request addressed to a name the daemon was not given is refused, so a
// page that DNS-rebinds its own name onto the daemon cannot read or write.
func TestHostCheck(t *testing.T) {
	t.Parallel()

	allowed := []string{"app.example", ".corp.example"}

	for host, want := range map[string]bool{
		"":                      true,
		"127.0.0.1:8080":        true,
		"[::1]:8080":            true,
		"192.168.1.20":          true,
		"localhost:8080":        true,
		"LocalHost.:8080":       true,
		"ui.localhost:5173":     true,
		"app.example:8080":      true,
		"corp.example":          true,
		"api.corp.example:8080": true,
		"rebound.example:8080":  false,
		"app.example.evil":      false,
		"xcorp.example":         false,
		"localhost.evil":        false,
	} {
		if got := hostAllowed(host, allowed); got != want {
			t.Errorf("hostAllowed(%q) = %v, want %v", host, got, want)
		}
	}

	// A name given to listen on is allowed without being listed.
	s, err := New(slog.New(slog.DiscardHandler), Config{Listen: "Daemon.internal:8080"}, testAssets)
	if err != nil {
		t.Fatal(err)
	}

	for host, status := range map[string]int{"daemon.internal:8080": http.StatusOK, "example.com": http.StatusForbidden} {
		rec := send(t, s.Handler(), func(r *http.Request) {
			r.Host = host
			r.URL.Path = "/api/v1/health"
		})
		if rec.Code != status {
			t.Errorf("GET with Host %q = %d, want %d", host, rec.Code, status)
		}
	}
}
