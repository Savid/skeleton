package server

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/savid/skeleton/api/rest"
)

// operations implements the ogen-generated operations. Adding an operation
// to api/openapi.yaml and running `make generate` fails the build until its
// method is added here.
type operations struct {
	log     *slog.Logger
	name    string
	version string
	now     func() time.Time
}

var _ rest.Handler = (*operations)(nil)

// health is the current health. Times in the API are always UTC: the
// generated client validates date-time fields with Zod, which accepts only
// the Z suffix, not a local offset.
func (a *operations) health() *rest.Health {
	return &rest.Health{Status: rest.HealthStatusOk, Version: a.version, At: a.now().UTC()}
}

func (a *operations) GetHealth(context.Context) (*rest.Health, error) {
	return a.health(), nil
}

// config is the public configuration: served by GetConfig and injected into
// index.html. Nothing here may be a secret.
func (a *operations) config() *rest.Config {
	return &rest.Config{Name: a.name, Version: a.version}
}

func (a *operations) GetConfig(context.Context) (*rest.Config, error) {
	return a.config(), nil
}

// NewError turns an unexpected handler error into a 500 problem.
func (a *operations) NewError(ctx context.Context, err error) *rest.ProblemStatusCode {
	a.log.ErrorContext(ctx, "api handler failed", "error", err)

	return problem(http.StatusInternalServerError, "")
}

func problem(status int, detail string) *rest.ProblemStatusCode {
	p := rest.Problem{Title: http.StatusText(status), Status: status}
	if detail != "" {
		p.Detail = rest.NewOptString(detail)
	}

	return &rest.ProblemStatusCode{StatusCode: status, Response: p}
}
