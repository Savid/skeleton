package server

import (
	"context"
	"mime"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-faster/yaml"

	"github.com/savid/skeleton/api"
)

// Every operation in the spec is served, by the ogen server or by hand, with
// the content type the spec declares for its success response. An operation
// ogen cannot generate (an event stream) that nobody hand-routed fails here.
func TestEveryOperationIsServed(t *testing.T) {
	t.Parallel()

	var spec struct {
		Paths map[string]map[string]any `yaml:"paths"`
	}
	if err := yaml.Unmarshal(api.Spec, &spec); err != nil {
		t.Fatal(err)
	}

	h := newTestServer(t).Handler()
	operations := 0

	// Request bodies, for the operations that take one.
	bodies := map[string]string{}

	for path, item := range spec.Paths {
		for method, raw := range item {
			op, ok := raw.(map[string]any)
			if !ok {
				continue
			}

			operations++
			want := successContentType(t, op)

			// A cancelled request ends event streams after their first event.
			ctx, cancel := context.WithCancel(t.Context())
			if want == "text/event-stream" {
				cancel()
			}

			rec := httptest.NewRecorder()
			req := httptest.NewRequestWithContext(ctx, strings.ToUpper(method), path, strings.NewReader(bodies[path]))
			req.Header.Set("Content-Type", "application/json")
			h.ServeHTTP(rec, req)

			cancel()

			got, _, _ := mime.ParseMediaType(rec.Header().Get("Content-Type"))
			if rec.Code != http.StatusOK || got != want {
				t.Errorf("%s (%s %s) = %d %q, want 200 %q", op["operationId"], method, path, rec.Code, got, want)
			}
		}
	}

	if operations == 0 {
		t.Fatal("spec has no operations")
	}
}

func successContentType(t *testing.T, op map[string]any) string {
	t.Helper()

	responses, _ := op["responses"].(map[string]any)
	ok, _ := responses["200"].(map[string]any)
	content, _ := ok["content"].(map[string]any)

	if len(content) != 1 {
		t.Fatalf("%s: want exactly one 200 content type, got %d", op["operationId"], len(content))
	}

	for contentType := range content {
		return contentType
	}

	return ""
}
