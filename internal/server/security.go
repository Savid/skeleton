package server

import (
	"log/slog"
	"net"
	"net/http"
	"net/netip"
	"slices"
	"strings"
)

// securityHeaders sets what every response carries: no MIME sniffing, no
// referrer sent to another origin, no framing, and no reading or embedding
// of the daemon's responses by another origin's pages. Responses that are
// not the UI's get a CSP that allows nothing; the UI handler replaces it
// with the page's own.
//
// Referrer-Policy is same-origin, not no-referrer: under no-referrer a
// browser sends `Origin: null` on a same-origin form post, which
// crossOriginProtection then refuses wherever there is no Sec-Fetch-Site
// (plain HTTP to anything but localhost).
func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("Referrer-Policy", "same-origin")
		h.Set("X-Frame-Options", "DENY")
		h.Set("Cross-Origin-Opener-Policy", "same-origin")
		h.Set("Cross-Origin-Resource-Policy", "same-origin")
		h.Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'")
		next.ServeHTTP(w, r)
	})
}

// hostCheck refuses a request whose Host is not the daemon's, which stops DNS
// rebinding: a page whose name an attacker re-points at this address is
// same-origin to the browser, so the browser's own checks and
// crossOriginProtection let it read and write. IP literals and localhost
// names are always allowed, since no DNS stands behind them; any other name
// must be listed in allowed, exactly, or under one that starts with a dot
// (".example.com" allows example.com and its subdomains).
func hostCheck(log *slog.Logger, allowed []string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if hostAllowed(r.Host, allowed) {
			next.ServeHTTP(w, r)

			return
		}

		log.WarnContext(r.Context(), "host not allowed", "host", r.Host)
		writeProblem(w, problem(http.StatusForbidden, "host not allowed; start skeletond with -allowed-host to serve it"))
	})
}

func hostAllowed(hostport string, allowed []string) bool {
	host := hostport
	if h, _, err := net.SplitHostPort(hostport); err == nil {
		host = h
	}

	host = strings.TrimSuffix(strings.ToLower(strings.Trim(host, "[]")), ".")

	if host == "" || host == "localhost" || strings.HasSuffix(host, ".localhost") {
		return true
	}

	if _, err := netip.ParseAddr(host); err == nil {
		return true
	}

	return slices.ContainsFunc(allowed, func(a string) bool {
		if domain, ok := strings.CutPrefix(a, "."); ok {
			return host == domain || strings.HasSuffix(host, a)
		}

		return host == a
	})
}

// crossOriginProtection refuses a browser's cross-origin POST, PUT, PATCH or
// DELETE (CSRF): the daemon has no authentication, so any page the person
// visits could otherwise write to it. Reads and non-browser clients pass.
// It does not cover a WebSocket upgrade, which is a GET.
func crossOriginProtection(log *slog.Logger, next http.Handler) http.Handler {
	c := http.NewCrossOriginProtection()
	c.SetDenyHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.WarnContext(r.Context(), "cross-origin request refused",
			"method", r.Method,
			"origin", r.Header.Get("Origin"),
			"secFetchSite", r.Header.Get("Sec-Fetch-Site"),
		)
		writeProblem(w, problem(http.StatusForbidden, "cross-origin request refused"))
	}))

	return c.Handler(next)
}
