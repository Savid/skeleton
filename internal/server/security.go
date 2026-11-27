package server

import "net/http"

// securityHeaders sets what every response carries: no MIME sniffing, no
// referrer leaking a URL to another site, no framing, and no reading or
// embedding of the daemon's responses by another origin's pages. The UI
// handler adds the page's Content-Security-Policy.
func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("Referrer-Policy", "no-referrer")
		h.Set("X-Frame-Options", "DENY")
		h.Set("Cross-Origin-Opener-Policy", "same-origin")
		h.Set("Cross-Origin-Resource-Policy", "same-origin")
		next.ServeHTTP(w, r)
	})
}

// crossOriginProtection refuses a browser's cross-origin POST, PUT, PATCH or
// DELETE (CSRF): the daemon has no authentication, so any page the person
// visits could otherwise write to it. Reads and non-browser clients pass.
func crossOriginProtection(next http.Handler) http.Handler {
	c := http.NewCrossOriginProtection()
	c.SetDenyHandler(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		writeProblem(w, problem(http.StatusForbidden, "cross-origin request refused"))
	}))

	return c.Handler(next)
}
