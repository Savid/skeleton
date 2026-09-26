// Command skeletond serves the API and the embedded web UI.
//
//	skeletond [flags]
//	skeletond -version
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/savid/skeleton/internal/server"
	"github.com/savid/skeleton/web"
)

// name is the daemon's display name, shown by the UI.
const name = "skeleton"

// version is set at build time: -ldflags "-X main.version=...".
var version = "dev"

func main() {
	if err := run(os.Args[1:], os.Stdout, os.Stderr); err != nil {
		fmt.Fprintln(os.Stderr, "skeletond:", err)
		os.Exit(1)
	}
}

type options struct {
	listen    string
	logFormat string
	logLevel  slog.Level
	version   bool
}

// errHelp is returned when -h or -help was given; usage has been printed.
var errHelp = errors.New("help requested")

func parse(args []string, stderr io.Writer) (options, error) {
	o := options{logLevel: slog.LevelInfo}

	fs := flag.NewFlagSet("skeletond", flag.ContinueOnError)
	fs.SetOutput(stderr)
	fs.StringVar(&o.listen, "listen", "127.0.0.1:8080", "HTTP listen address")
	fs.StringVar(&o.logFormat, "log-format", "text", "log format: text or json")
	fs.TextVar(&o.logLevel, "log-level", o.logLevel, "log level: DEBUG, INFO, WARN or ERROR")
	fs.BoolVar(&o.version, "version", false, "print the version and exit")

	if err := fs.Parse(args); err != nil {
		if errors.Is(err, flag.ErrHelp) {
			return o, errHelp
		}

		return o, fmt.Errorf("flags: %w", err)
	}

	if o.logFormat != "text" && o.logFormat != "json" {
		return o, fmt.Errorf("-log-format %q: text or json", o.logFormat)
	}

	return o, nil
}

func run(args []string, stdout, stderr io.Writer) error {
	o, err := parse(args, stderr)
	if errors.Is(err, errHelp) {
		return nil
	}

	if err != nil {
		return err
	}

	if o.version {
		fmt.Fprintln(stdout, version)

		return nil
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	assets, err := web.FS()
	if err != nil {
		return fmt.Errorf("web assets: %w", err)
	}

	log := newLogger(stderr, o).With("version", version)

	srv, err := server.New(log, server.Config{Listen: o.listen, Name: name, Version: version}, assets)
	if err != nil {
		return err
	}

	log.InfoContext(ctx, "starting")

	return srv.Run(ctx)
}

// newLogger builds the process logger: text for a terminal, JSON for a log
// collector.
func newLogger(w io.Writer, o options) *slog.Logger {
	opts := &slog.HandlerOptions{Level: o.logLevel}
	if o.logFormat == "json" {
		return slog.New(slog.NewJSONHandler(w, opts))
	}

	return slog.New(slog.NewTextHandler(w, opts))
}
