package server

import (
	"net/http"
	"time"
)

const (
	// streamKeepalive is shorter than common proxy idle timeouts.
	streamKeepalive = 15 * time.Second
	// streamRetry is the reconnect delay sent to clients.
	streamRetry = 2 * time.Second
)

// streamEvents serves streamEvents: a `health` event on connect and every
// StreamInterval. Replace or extend it with the events your domain publishes;
// every event is complete, so there is no resume cursor.
func (s *Server) streamEvents(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	sse, err := startSSE(w, streamRetry)
	if err != nil {
		return
	}

	send := func() bool {
		data, encodeErr := s.ops.health().MarshalJSON()
		if encodeErr != nil {
			s.log.ErrorContext(ctx, "encode health", "error", encodeErr)

			return false
		}

		return sse.event("health", data) == nil
	}

	if !send() {
		return
	}

	keepalive := time.NewTicker(streamKeepalive)
	defer keepalive.Stop()

	health := time.NewTicker(s.cfg.StreamInterval)
	defer health.Stop()

	for ok := true; ok; {
		select {
		case <-ctx.Done():
			return
		case <-s.shutdown:
			return
		case <-keepalive.C:
			ok = sse.ping() == nil
		case <-health.C:
			ok = send()
		}
	}
}
