package server

import (
	"bufio"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/savid/skeleton/api/rest"
)

type event struct {
	name string
	data []byte
}

// readEvents reads frames from the stream until n events have arrived.
func readEvents(t *testing.T, base string, n int) (retry string, events []event) {
	t.Helper()

	req, err := http.NewRequestWithContext(t.Context(), http.MethodGet, base+"/api/v1/stream", nil)
	if err != nil {
		t.Fatal(err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}

	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK || resp.Header.Get("Content-Type") != "text/event-stream" {
		t.Fatalf("stream = %d %q", resp.StatusCode, resp.Header.Get("Content-Type"))
	}

	lines := bufio.NewScanner(resp.Body)

	var ev event

	for len(events) < n && lines.Scan() {
		line := lines.Text()
		switch {
		case strings.HasPrefix(line, "retry: "):
			retry = strings.TrimPrefix(line, "retry: ")
		case strings.HasPrefix(line, "event: "):
			ev.name = strings.TrimPrefix(line, "event: ")
		case strings.HasPrefix(line, "data: "):
			ev.data = []byte(strings.TrimPrefix(line, "data: "))
		case line == "" && ev.data != nil:
			events = append(events, ev)
			ev = event{}
		}
	}

	if len(events) < n {
		t.Fatalf("stream ended after %d events: %v", len(events), lines.Err())
	}

	return retry, events
}

// The stream sends its retry hint, then a health event on connect and again
// on every interval.
func TestStreamEvents(t *testing.T) {
	t.Parallel()

	ts := httptest.NewServer(newTestServer(t).Handler())
	defer ts.Close()

	retry, events := readEvents(t, ts.URL, 2)

	if retry != "2000" {
		t.Errorf("retry = %q, want 2000", retry)
	}

	for _, ev := range events {
		if ev.name != "health" {
			t.Fatalf("event = %q, want health", ev.name)
		}

		var h rest.Health
		if err := h.UnmarshalJSON(ev.data); err != nil {
			t.Fatal(err)
		}

		if h.Version != "test" || !h.At.Equal(testNow) {
			t.Errorf("health = %+v", h)
		}
	}
}
