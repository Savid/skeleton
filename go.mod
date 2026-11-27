module github.com/savid/skeleton

go 1.27.4

// pnpm's dependency trees, at any depth: never Go packages, and full of
// symlinks.
ignore node_modules

tool (
	github.com/ogen-go/ogen/cmd/ogen
	golang.org/x/vuln/cmd/govulncheck
)

require (
	github.com/go-faster/errors v0.8.0
	github.com/go-faster/jx v1.2.0
	github.com/go-faster/yaml v0.4.6
	github.com/ogen-go/ogen v1.25.0
)

require (
	github.com/dlclark/regexp2 v1.12.0 // indirect
	github.com/fatih/color v1.19.0 // indirect
	github.com/ghodss/yaml v1.0.0 // indirect
	github.com/google/go-cmp v0.7.0 // indirect
	github.com/google/uuid v1.6.0 // indirect
	github.com/kr/pretty v0.3.1 // indirect
	github.com/mattn/go-colorable v0.1.16 // indirect
	github.com/mattn/go-isatty v0.0.24 // indirect
	github.com/rogpeppe/go-internal v1.16.0 // indirect
	github.com/segmentio/asm v1.2.1 // indirect
	github.com/shopspring/decimal v1.6.0 // indirect
	github.com/yuin/goldmark v1.8.7 // indirect
	go.uber.org/multierr v1.11.0 // indirect
	go.uber.org/zap v1.28.0 // indirect
	golang.org/x/exp v0.0.0-20261124000051-d6646c509b6d // indirect
	golang.org/x/mod v0.43.0 // indirect
	golang.org/x/net v0.63.0 // indirect
	golang.org/x/sync v0.25.0 // indirect
	golang.org/x/sys v0.50.0 // indirect
	golang.org/x/telemetry v0.0.0-20261124234621-1402bdb29cb5 // indirect
	golang.org/x/text v0.44.0 // indirect
	golang.org/x/tools v0.53.0 // indirect
	golang.org/x/vuln v1.10.0 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
)
