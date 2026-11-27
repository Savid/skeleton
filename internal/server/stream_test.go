package server

import (
	"bufio"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"slices"
	"strings"
	"testing"
	"testing/synctest"
	"time"

	"github.com/savid/skeleton/api/rest"
)

// frame is one line of the stream and how long after connecting it arrived.
type frame struct {
	at   time.Duration
	line string
}

// The stream sends its retry hint and a health event on connect, a health
// event every 5 s (the default StreamInterval) and a ping comment every 15 s,
// on the real schedule: the test runs in a synctest bubble, where time is
// fake and the network in memory, so it takes no time and cannot flake.
func TestStreamEvents(t *testing.T) {
	t.Parallel()

	synctest.Test(t, func(t *testing.T) {
		frames := readUntilPing(t, openStream(t))

		if len(frames) < 2 || frames[0] != (frame{0, "retry: 2000"}) || frames[1] != (frame{0, "event: health"}) {
			t.Fatalf("stream opened with %v, want the retry hint then a health event at once", frames)
		}

		// The third interval's health event ties with the ping, so it may
		// come either side of it.
		want := []time.Duration{0, 5 * time.Second, 10 * time.Second}
		if got := healthTimes(t, frames); !slices.Equal(got[:min(len(got), len(want))], want) {
			t.Errorf("health events at %v, want %v", got, want)
		}

		// Under the 30 s and longer idle timeouts of common proxies.
		if last := frames[len(frames)-1]; last.at != 15*time.Second {
			t.Errorf("ping at %v, want 15s", last.at)
		}
	})
}

// openStream serves a daemon with the default stream settings on the
// in-memory network and opens its event stream. Closing the body at the end
// of the test ends the stream.
func openStream(t *testing.T) io.Reader {
	t.Helper()

	// The in-memory network addresses the server as example.com.
	s, err := New(slog.New(slog.DiscardHandler), Config{
		Listen: "127.0.0.1:0", AllowedHosts: []string{"example.com"}, Version: "test",
		Now: func() time.Time { return testNow },
	}, testAssets)
	if err != nil {
		t.Fatal(err)
	}

	ts := httptest.NewTestServer(t, s.Handler())
	client := ts.Client() // starts it, on the in-memory network

	req, err := http.NewRequestWithContext(t.Context(), http.MethodGet, ts.URL+"/api/v1/stream", nil)
	if err != nil {
		t.Fatal(err)
	}

	resp, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}

	t.Cleanup(func() { _ = resp.Body.Close() })

	if resp.StatusCode != http.StatusOK || resp.Header.Get("Content-Type") != "text/event-stream" {
		t.Fatalf("stream = %d %q", resp.StatusCode, resp.Header.Get("Content-Type"))
	}

	return resp.Body
}

// readUntilPing reads the stream's non-empty lines, each with its arrival
// time, up to and including the first ping.
func readUntilPing(t *testing.T, body io.Reader) []frame {
	t.Helper()

	start := time.Now()
	lines := bufio.NewScanner(body)

	var frames []frame

	for lines.Scan() {
		if line := lines.Text(); line != "" {
			frames = append(frames, frame{time.Since(start), line})
			if line == ": ping" {
				return frames
			}
		}
	}

	t.Fatalf("stream ended before a ping (%v): %v", lines.Err(), frames)

	return nil
}

// healthTimes decodes each data line as a Health, checks it, and returns when
// each arrived.
func healthTimes(t *testing.T, frames []frame) []time.Duration {
	t.Helper()

	var times []time.Duration

	for _, f := range frames {
		data, ok := strings.CutPrefix(f.line, "data: ")
		if !ok {
			continue
		}

		var h rest.Health
		if err := h.UnmarshalJSON([]byte(data)); err != nil {
			t.Fatalf("health at %v: %v", f.at, err)
		}

		if h.Version != "test" || !h.At.Equal(testNow) {
			t.Errorf("health at %v = %+v", f.at, h)
		}

		times = append(times, f.at)
	}

	return times
}
