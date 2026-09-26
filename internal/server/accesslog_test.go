package server

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAccessLog(t *testing.T) {
	t.Parallel()

	var buf bytes.Buffer

	log := slog.New(slog.NewJSONHandler(&buf, &slog.HandlerOptions{Level: slog.LevelDebug}))
	h := accessLog(log, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/boom" {
			w.WriteHeader(http.StatusInternalServerError)
		}

		_, _ = w.Write([]byte("hello"))
	}))

	for _, tc := range []struct {
		path   string
		status int
		level  string
	}{
		{"/ok", http.StatusOK, "DEBUG"},
		{"/boom", http.StatusInternalServerError, "WARN"},
	} {
		buf.Reset()

		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequestWithContext(t.Context(), http.MethodGet, tc.path, nil))

		var line struct {
			Level  string `json:"level"`
			Msg    string `json:"msg"`
			Path   string `json:"path"`
			Status int    `json:"status"`
			Bytes  int    `json:"bytes"`
		}
		if err := json.Unmarshal(buf.Bytes(), &line); err != nil {
			t.Fatalf("%s: log %q: %v", tc.path, buf.String(), err)
		}

		if line.Level != tc.level || line.Msg != "request" || line.Path != tc.path || line.Status != tc.status || line.Bytes != 5 {
			t.Errorf("%s: logged %+v", tc.path, line)
		}
	}
}

// The wrapper must not hide Flush from the event stream.
func TestStatusWriterUnwraps(t *testing.T) {
	t.Parallel()

	rec := httptest.NewRecorder()
	sw := &statusWriter{ResponseWriter: rec}

	if err := http.NewResponseController(sw).Flush(); err != nil {
		t.Fatalf("flush through the wrapper: %v", err)
	}

	if !rec.Flushed {
		t.Fatal("flush did not reach the recorder")
	}
}
