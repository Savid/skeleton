package main

import (
	"bytes"
	"errors"
	"log/slog"
	"strings"
	"testing"
)

func TestParse(t *testing.T) {
	t.Parallel()

	for name, tc := range map[string]struct {
		args    []string
		want    options
		wantErr string
	}{
		"defaults": {
			args: nil,
			want: options{listen: "127.0.0.1:8080", logFormat: "text", logLevel: slog.LevelInfo},
		},
		"everything set": {
			args: []string{"-listen", ":9000", "-log-format", "json", "-log-level", "debug", "-version"},
			want: options{listen: ":9000", logFormat: "json", logLevel: slog.LevelDebug, version: true},
		},
		"bad format":  {args: []string{"-log-format", "yaml"}, wantErr: `-log-format "yaml": text or json`},
		"bad level":   {args: []string{"-log-level", "loud"}, wantErr: "flags: "},
		"unknown":     {args: []string{"-nope"}, wantErr: "flags: "},
		"help wanted": {args: []string{"-h"}, wantErr: errHelp.Error()},
	} {
		t.Run(name, func(t *testing.T) {
			t.Parallel()

			var stderr bytes.Buffer

			got, err := parse(tc.args, &stderr)

			switch {
			case tc.wantErr == "" && err != nil:
				t.Fatalf("parse(%q) = %v", tc.args, err)
			case tc.wantErr != "" && (err == nil || !strings.Contains(err.Error(), tc.wantErr)):
				t.Fatalf("parse(%q) error = %v, want %q", tc.args, err, tc.wantErr)
			case err == nil && got != tc.want:
				t.Fatalf("parse(%q) = %+v, want %+v", tc.args, got, tc.want)
			}
		})
	}
}

func TestRunPrintsVersionAndHelp(t *testing.T) {
	t.Parallel()

	var stdout, stderr bytes.Buffer

	if err := run([]string{"-version"}, &stdout, &stderr); err != nil || strings.TrimSpace(stdout.String()) != version {
		t.Fatalf("run(-version) = %v, stdout %q", err, stdout.String())
	}

	stdout.Reset()

	if err := run([]string{"-h"}, &stdout, &stderr); err != nil || !strings.Contains(stderr.String(), "-listen") {
		t.Fatalf("run(-h) = %v, stderr %q", err, stderr.String())
	}

	err := run([]string{"-log-format", "yaml"}, &stdout, &stderr)
	if err == nil || errors.Is(err, errHelp) {
		t.Fatalf("run(bad flag) = %v", err)
	}
}
