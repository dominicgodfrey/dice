// Package fixtures embeds the hand-maintained data files the server serves
// (PLAN.md D5, D6). The app bundles the same files as its fallback; the
// sync-fixtures script in app/ copies them and CI checks they match.
package fixtures

import (
	"embed"
	"fmt"
	"sort"
	"strings"
)

//go:embed *.json
var files embed.FS

// Names lists every fixture, without the .json suffix, sorted.
func Names() []string {
	entries, err := files.ReadDir(".")
	if err != nil {
		return nil
	}
	var names []string
	for _, e := range entries {
		if strings.HasSuffix(e.Name(), ".json") {
			names = append(names, strings.TrimSuffix(e.Name(), ".json"))
		}
	}
	sort.Strings(names)
	return names
}

// Read returns the raw JSON for a fixture by name.
func Read(name string) ([]byte, error) {
	if strings.ContainsAny(name, "/\\.") {
		return nil, fmt.Errorf("fixtures: bad name %q", name)
	}
	return files.ReadFile(name + ".json")
}
