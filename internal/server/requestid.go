package server

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log/slog"
	"net/http"
)

// requestIDHeader is the header a proxy in front of the daemon sets, and the
// one the daemon echoes back so a person can quote the ID from a response.
const requestIDHeader = "X-Request-Id"

type requestIDKey struct{}

// RequestID returns the request's ID, or "" outside a request.
func RequestID(ctx context.Context) string {
	id, _ := ctx.Value(requestIDKey{}).(string)

	return id
}

// withRequestID gives every request an ID: the proxy's when it sent one,
// otherwise a fresh one. The ID rides on the context, so every log line the
// handler writes carries it, and is echoed in the response.
func withRequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get(requestIDHeader)
		if id == "" || len(id) > 128 {
			id = newRequestID()
		}

		w.Header().Set(requestIDHeader, id)
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), requestIDKey{}, id)))
	})
}

func newRequestID() string {
	var b [16]byte

	rand.Read(b[:]) // never fails; it panics if the OS entropy source is unusable

	return hex.EncodeToString(b[:])
}

// requestIDHandler adds the context's request ID to every record, so
// handlers log with the plain …Context methods and correlation comes free.
type requestIDHandler struct{ slog.Handler }

func (h requestIDHandler) Handle(ctx context.Context, r slog.Record) error {
	if id := RequestID(ctx); id != "" {
		r.AddAttrs(slog.String("requestId", id))
	}

	return h.Handler.Handle(ctx, r)
}

func (h requestIDHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return requestIDHandler{h.Handler.WithAttrs(attrs)}
}

func (h requestIDHandler) WithGroup(name string) slog.Handler {
	return requestIDHandler{h.Handler.WithGroup(name)}
}
