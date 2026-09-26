// Package web embeds the frontend build output from web/dist.
package web

import (
	"embed"
	"io/fs"
)

//go:embed all:dist
var dist embed.FS

// FS returns the embedded build output rooted at dist/.
func FS() (fs.FS, error) {
	return fs.Sub(dist, "dist")
}
