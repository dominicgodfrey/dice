// Package scrape reads the public Brandeis sources that need no permission
// (PLAN.md D40): the dining site for hours and menus, LaundryView for
// machines, LibCal for library hours. Each parser works on saved pages in
// testdata so a site change shows up as a failing test, not a blank tile.
package scrape

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"
)

var clockRe = regexp.MustCompile(`(?i)^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\s*$`)

// ParseClock turns "7:30am", "10pm", "11:00 PM" or "14:00" into "HH:MM".
func ParseClock(s string) (string, error) {
	m := clockRe.FindStringSubmatch(s)
	if m == nil {
		return "", fmt.Errorf("scrape: bad clock %q", s)
	}
	h, _ := strconv.Atoi(m[1])
	min := 0
	if m[2] != "" {
		min, _ = strconv.Atoi(m[2])
	}
	ampm := strings.ToLower(strings.ReplaceAll(m[3], ".", ""))
	switch ampm {
	case "am":
		if h == 12 {
			h = 0
		}
	case "pm":
		if h != 12 {
			h += 12
		}
	}
	if h > 24 || min > 59 {
		return "", fmt.Errorf("scrape: bad clock %q", s)
	}
	return fmt.Sprintf("%02d:%02d", h%24, min), nil
}

// HHMM formats a time in a zone as "HH:MM".
func HHMM(t time.Time, loc *time.Location) string {
	return t.In(loc).Format("15:04")
}

// Slug lowercases and hyphenates a name for use as an ID.
func Slug(s string) string {
	var b strings.Builder
	last := '-'
	for _, r := range strings.ToLower(strings.TrimSpace(s)) {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
			last = r
		default:
			if last != '-' {
				b.WriteRune('-')
				last = '-'
			}
		}
	}
	return strings.Trim(b.String(), "-")
}
