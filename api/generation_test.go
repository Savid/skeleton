package api_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// The generated server is server-only: no client, no telemetry hooks, no
// Unimplemented stub. A new operation must fail to compile until it is
// implemented, and telemetry belongs to the server's own middleware.
func TestGeneratedServerIsServerOnly(t *testing.T) {
	t.Parallel()

	entries, err := os.ReadDir("rest")
	if err != nil {
		t.Fatal(err)
	}

	if len(entries) == 0 {
		t.Fatal("api/rest is empty: run make generate")
	}

	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".go") {
			continue
		}

		for _, banned := range []string{"_client_gen.go", "_unimplemented_gen.go"} {
			if strings.HasSuffix(e.Name(), banned) {
				t.Errorf("api/rest/%s: the server pass must not generate %s", e.Name(), banned)
			}
		}

		src, readErr := os.ReadFile(filepath.Join("rest", e.Name()))
		if readErr != nil {
			t.Fatal(readErr)
		}

		for _, banned := range []string{"type Client struct", "func NewClient(", "ogen-go/ogen/otelogen", "type UnimplementedHandler"} {
			if strings.Contains(string(src), banned) {
				t.Errorf("api/rest/%s contains %q", e.Name(), banned)
			}
		}
	}
}
