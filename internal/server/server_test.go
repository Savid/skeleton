package server

import (
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"
	"time"

	"github.com/savid/skeleton/api/rest"
)

var testAssets = fstest.MapFS{"index.html": {Data: []byte("<!doctype html><title>app</title>")}}

// testNow is in a local zone on purpose: the API must answer in UTC.
var testNow = time.Date(2026, 9, 26, 22, 0, 0, 0, time.FixedZone("AEST", 10*3600))

func newTestServer(t *testing.T) *Server {
	t.Helper()

	cfg := Config{Listen: "127.0.0.1:0", Version: "test", StreamInterval: 10 * time.Millisecond, Now: func() time.Time { return testNow }}

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
