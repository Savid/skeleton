package server

import (
	"log/slog"
	"net/http"
	"time"
)

// accessLog logs one line per request at debug level, and at warn for
// server errors. Event streams are logged when they end, with their
// duration. It runs inside withRequestID, so each line carries the request
// ID. Wrap the whole mux so hand-routed handlers are covered too.
func accessLog(log *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		sw := &statusWriter{ResponseWriter: w}

		next.ServeHTTP(sw, r)

		level := slog.LevelDebug
		if sw.status >= http.StatusInternalServerError {
			level = slog.LevelWarn
		}

		log.LogAttrs(r.Context(), level, "request",
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.Int("status", sw.status),
			slog.Int64("bytes", sw.bytes),
			slog.Duration("took", time.Since(start)),
		)
	})
}

// statusWriter records what the handler wrote. Unwrap lets
// http.ResponseController reach the underlying writer, which event streams
// need for Flush and SetWriteDeadline.
type statusWriter struct {
	http.ResponseWriter
	status int
	bytes  int64
}

func (w *statusWriter) WriteHeader(code int) {
	if w.status == 0 {
		w.status = code
	}

	w.ResponseWriter.WriteHeader(code)
}

func (w *statusWriter) Write(b []byte) (int, error) {
	if w.status == 0 {
		w.status = http.StatusOK
	}

	n, err := w.ResponseWriter.Write(b)
	w.bytes += int64(n)

	return n, err
}

func (w *statusWriter) Unwrap() http.ResponseWriter { return w.ResponseWriter }
