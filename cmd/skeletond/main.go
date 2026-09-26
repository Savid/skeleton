// Command skeletond serves the API and the embedded web UI.
//
//	skeletond [flags]
package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/savid/skeleton/internal/server"
	"github.com/savid/skeleton/web"
)

// version is set at build time: -ldflags "-X main.version=...".
var version = "dev"

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, "skeletond:", err)
		os.Exit(1)
	}
}

type options struct {
	listen string
}

func parse(args []string) (options, error) {
	var o options

	fs := flag.NewFlagSet("skeletond", flag.ContinueOnError)
	fs.StringVar(&o.listen, "listen", "127.0.0.1:8080", "HTTP listen address")

	if err := fs.Parse(args); err != nil {
		return o, fmt.Errorf("flags: %w", err)
	}

	return o, nil
}

func run(args []string) error {
	o, err := parse(args)
	if err != nil {
		return err
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	assets, err := web.FS()
	if err != nil {
		return fmt.Errorf("web assets: %w", err)
	}

	log := slog.New(slog.NewTextHandler(os.Stderr, nil)).With("version", version)

	srv, err := server.New(log, server.Config{Listen: o.listen, Version: version}, assets)
	if err != nil {
		return err
	}

	log.InfoContext(ctx, "starting")

	return srv.Run(ctx)
}
