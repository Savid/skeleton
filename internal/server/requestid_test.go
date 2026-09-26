package server

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"regexp"
	"testing"
)

var hex32 = regexp.MustCompile(`^[0-9a-f]{32}$`)

func TestRequestID(t *testing.T) {
	t.Parallel()

	var buf bytes.Buffer

	log := slog.New(requestIDHandler{slog.NewJSONHandler(&buf, nil)})
	h := withRequestID(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.InfoContext(r.Context(), "handling")
		w.WriteHeader(http.StatusNoContent)
	}))

	// A proxy's ID is kept and echoed.
	rec := httptest.NewRecorder()
	req := httptest.NewRequestWithContext(t.Context(), http.MethodGet, "/", nil)
	req.Header.Set(requestIDHeader, "proxy-123")
	h.ServeHTTP(rec, req)

	if got := rec.Header().Get(requestIDHeader); got != "proxy-123" {
		t.Errorf("echoed %q, want proxy-123", got)
	}

	var line struct {
		RequestID string `json:"requestId"`
	}
	if err := json.Unmarshal(buf.Bytes(), &line); err != nil || line.RequestID != "proxy-123" {
		t.Errorf("logged %s (%v), want requestId proxy-123", buf.String(), err)
	}

	// Without one, a fresh ID is made, echoed and logged.
	buf.Reset()

	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequestWithContext(t.Context(), http.MethodGet, "/", nil))

	got := rec.Header().Get(requestIDHeader)
	if !hex32.MatchString(got) {
		t.Errorf("generated %q, want 32 hex characters", got)
	}

	if err := json.Unmarshal(buf.Bytes(), &line); err != nil || line.RequestID != got {
		t.Errorf("logged %s (%v), want requestId %s", buf.String(), err, got)
	}
}

// Outside a request the handler adds nothing.
func TestRequestIDHandlerOutsideRequest(t *testing.T) {
	t.Parallel()

	var buf bytes.Buffer

	slog.New(requestIDHandler{slog.NewJSONHandler(&buf, nil)}).InfoContext(t.Context(), "boot")

	if bytes.Contains(buf.Bytes(), []byte("requestId")) {
		t.Errorf("logged %s, want no requestId", buf.String())
	}
}
