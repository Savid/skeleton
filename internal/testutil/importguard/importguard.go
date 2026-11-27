// Package importguard lists the repository's Go packages and their imports,
// so a test can assert a dependency boundary that a code review would
// otherwise have to remember: which packages may import the generated API,
// the embedded UI, or each other.
package importguard

import (
	"encoding/json"
	"errors"
	"io"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"
)

const goListTimeout = 60 * time.Second

// Package is one Go package and what it imports, from go list.
type Package struct {
	ImportPath   string
	Imports      []string
	TestImports  []string
	XTestImports []string
}

// Module is the module path every repository package starts with.
const Module = "github.com/savid/skeleton"

// RepoRoot is the repository root, found from this file's location.
func RepoRoot(tb testing.TB) string {
	tb.Helper()

	_, file, _, ok := runtime.Caller(0)
	if !ok {
		tb.Fatal("cannot resolve the test's own path")
	}

	return filepath.Clean(filepath.Join(filepath.Dir(file), "..", "..", ".."))
}

// Packages lists the packages matching patterns (./... for all), with
// their production and test imports.
func Packages(tb testing.TB, patterns ...string) []Package {
	tb.Helper()

	ctx, cancel := tb.Context(), func() {}
	if _, has := ctx.Deadline(); !has {
		ctx, cancel = contextWithTimeout(ctx, goListTimeout)
	}
	defer cancel()

	args := append([]string{"list", "-json=ImportPath,Imports,TestImports,XTestImports"}, patterns...)
	cmd := exec.CommandContext(ctx, "go", args...)
	cmd.Dir = RepoRoot(tb)
	cmd.Env = append(cmd.Environ(), "GOWORK=off")

	out, err := cmd.Output()
	if err != nil {
		if exitErr, ok := errors.AsType[*exec.ExitError](err); ok {
			tb.Fatalf("go %s: %v\n%s", strings.Join(args, " "), err, exitErr.Stderr)
		}

		tb.Fatalf("go %s: %v", strings.Join(args, " "), err)
	}

	dec := json.NewDecoder(strings.NewReader(string(out)))

	var packages []Package

	for {
		var p Package

		err = dec.Decode(&p)
		if errors.Is(err, io.EOF) {
			return packages
		}

		if err != nil {
			tb.Fatalf("decode go list output: %v", err)
		}

		packages = append(packages, p)
	}
}

// Within reports whether path is prefix itself or a package under it.
func Within(path, prefix string) bool {
	return path == prefix || strings.HasPrefix(path, prefix+"/")
}

// Importers returns the packages whose production imports include one
// within prefix, excluding packages within prefix themselves.
func Importers(packages []Package, prefix string) []string {
	var out []string

	for _, p := range packages {
		if Within(p.ImportPath, prefix) {
			continue
		}

		for _, imp := range p.Imports {
			if Within(imp, prefix) {
				out = append(out, p.ImportPath)

				break
			}
		}
	}

	return out
}
