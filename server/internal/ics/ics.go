// Package ics parses iCalendar VEVENTs into the events shape the app reads
// (PLAN.md Phase 4). It covers what CampusGroups and the registrar's
// calendar emit: folded lines, DATE and DATE-TIME values, TZID, UTC, and
// backslash escapes. Recurrence rules are not expanded.
package ics

import (
	"bufio"
	"io"
	"strings"
	"time"
)

// Event is one VEVENT in the app's shape.
type Event struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Start    string `json:"start"`
	End      string `json:"end"`
	Location string `json:"location"`
	Category string `json:"category"`
	URL      string `json:"url"`
}

// Parse reads a calendar. `category` is stamped on every event; `fallback`
// is the zone for floating times and unknown TZIDs.
func Parse(r io.Reader, category string, fallback *time.Location) ([]Event, error) {
	lines, err := unfold(r)
	if err != nil {
		return nil, err
	}
	if fallback == nil {
		fallback = time.Local
	}
	var events []Event
	var cur map[string]prop
	for _, line := range lines {
		switch {
		case line == "BEGIN:VEVENT":
			cur = map[string]prop{}
		case line == "END:VEVENT":
			if cur != nil {
				if e, ok := build(cur, category, fallback); ok {
					events = append(events, e)
				}
			}
			cur = nil
		case cur != nil:
			name, p := parseLine(line)
			if name != "" {
				cur[name] = p
			}
		}
	}
	return events, nil
}

type prop struct {
	params map[string]string
	value  string
}

// unfold joins continuation lines (a line starting with a space or tab
// continues the previous one) and strips CR.
func unfold(r io.Reader) ([]string, error) {
	sc := bufio.NewScanner(r)
	sc.Buffer(make([]byte, 0, 64*1024), 4*1024*1024)
	var out []string
	for sc.Scan() {
		line := strings.TrimRight(sc.Text(), "\r")
		if len(out) > 0 && (strings.HasPrefix(line, " ") || strings.HasPrefix(line, "\t")) {
			out[len(out)-1] += line[1:]
			continue
		}
		out = append(out, line)
	}
	return out, sc.Err()
}

func parseLine(line string) (string, prop) {
	i := strings.Index(line, ":")
	if i < 0 {
		return "", prop{}
	}
	head, value := line[:i], line[i+1:]
	parts := strings.Split(head, ";")
	name := strings.ToUpper(parts[0])
	params := map[string]string{}
	for _, kv := range parts[1:] {
		if j := strings.Index(kv, "="); j > 0 {
			params[strings.ToUpper(kv[:j])] = strings.Trim(kv[j+1:], "\"")
		}
	}
	return name, prop{params: params, value: value}
}

func unescape(s string) string {
	var b strings.Builder
	for i := 0; i < len(s); i++ {
		if s[i] == '\\' && i+1 < len(s) {
			i++
			switch s[i] {
			case 'n', 'N':
				b.WriteByte('\n')
			default:
				b.WriteByte(s[i])
			}
			continue
		}
		b.WriteByte(s[i])
	}
	return b.String()
}

// parseTime handles 20260911, 20260911T140000, 20260911T140000Z.
// Returns the time and whether it was a DATE (all-day) value.
func parseTime(p prop, fallback *time.Location) (time.Time, bool, bool) {
	v := strings.TrimSpace(p.value)
	if v == "" {
		return time.Time{}, false, false
	}
	if strings.EqualFold(p.params["VALUE"], "DATE") || len(v) == 8 {
		t, err := time.ParseInLocation("20060102", v, fallback)
		return t, true, err == nil
	}
	if strings.HasSuffix(v, "Z") {
		t, err := time.Parse("20060102T150405Z", v)
		return t, false, err == nil
	}
	loc := fallback
	if tz := p.params["TZID"]; tz != "" {
		if l, err := time.LoadLocation(tz); err == nil {
			loc = l
		}
	}
	t, err := time.ParseInLocation("20060102T150405", v, loc)
	return t, false, err == nil
}

func build(props map[string]prop, category string, fallback *time.Location) (Event, bool) {
	start, allDay, ok := parseTime(props["DTSTART"], fallback)
	if !ok {
		return Event{}, false
	}
	end, _, okEnd := parseTime(props["DTEND"], fallback)
	if !okEnd {
		if d := props["DURATION"].value; d != "" {
			end = start.Add(parseDuration(d))
		} else if allDay {
			end = start.Add(24 * time.Hour)
		} else {
			end = start.Add(time.Hour)
		}
	}
	if allDay {
		// ICS all-day ends are exclusive; the app wants the last minute.
		end = end.Add(-time.Minute)
	}
	title := strings.TrimSpace(unescape(props["SUMMARY"].value))
	if title == "" {
		title = "(untitled)"
	}
	id := strings.TrimSpace(props["UID"].value)
	if id == "" {
		id = start.Format("20060102T150405") + "-" + title
	}
	return Event{
		ID:       id,
		Title:    title,
		Start:    start.Format(time.RFC3339),
		End:      end.Format(time.RFC3339),
		Location: strings.TrimSpace(unescape(props["LOCATION"].value)),
		Category: category,
		URL:      strings.TrimSpace(props["URL"].value),
	}, true
}

// parseDuration handles the common P1D, PT2H, PT30M, PT1H30M forms.
func parseDuration(s string) time.Duration {
	s = strings.ToUpper(strings.TrimPrefix(s, "+"))
	s = strings.TrimPrefix(s, "P")
	var d time.Duration
	num := 0
	inTime := false
	for _, c := range s {
		switch {
		case c >= '0' && c <= '9':
			num = num*10 + int(c-'0')
		case c == 'T':
			inTime = true
		case c == 'W':
			d += time.Duration(num) * 7 * 24 * time.Hour
			num = 0
		case c == 'D':
			d += time.Duration(num) * 24 * time.Hour
			num = 0
		case c == 'H':
			d += time.Duration(num) * time.Hour
			num = 0
		case c == 'M' && inTime:
			d += time.Duration(num) * time.Minute
			num = 0
		case c == 'S':
			d += time.Duration(num) * time.Second
			num = 0
		}
	}
	return d
}
