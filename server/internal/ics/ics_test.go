package ics

import (
	"strings"
	"testing"
	"time"
)

const sample = "BEGIN:VCALENDAR\r\n" +
	"VERSION:2.0\r\n" +
	"BEGIN:VEVENT\r\n" +
	"UID:1@example\r\n" +
	"SUMMARY:Club Fair\\, on the lawn\r\n" +
	"DTSTART;TZID=America/New_York:20260911T140000\r\n" +
	"DTEND;TZID=America/New_York:20260911T160000\r\n" +
	"LOCATION:Great Lawn\r\n" +
	"URL:https://example.com/fair\r\n" +
	"DESCRIPTION:A very long description that is folded across\r\n" +
	"  two lines\r\n" +
	"END:VEVENT\r\n" +
	"BEGIN:VEVENT\r\n" +
	"UID:2@example\r\n" +
	"SUMMARY:Add/drop deadline\r\n" +
	"DTSTART;VALUE=DATE:20260915\r\n" +
	"DTEND;VALUE=DATE:20260916\r\n" +
	"END:VEVENT\r\n" +
	"BEGIN:VEVENT\r\n" +
	"UID:3@example\r\n" +
	"SUMMARY:UTC event\r\n" +
	"DTSTART:20260920T180000Z\r\n" +
	"DURATION:PT1H30M\r\n" +
	"END:VEVENT\r\n" +
	"BEGIN:VEVENT\r\n" +
	"SUMMARY:No start\r\n" +
	"END:VEVENT\r\n" +
	"END:VCALENDAR\r\n"

func TestParse(t *testing.T) {
	ny, _ := time.LoadLocation("America/New_York")
	events, err := Parse(strings.NewReader(sample), "campus", ny)
	if err != nil {
		t.Fatal(err)
	}
	if len(events) != 3 {
		t.Fatalf("want 3 events, got %d: %+v", len(events), events)
	}

	fair := events[0]
	if fair.Title != "Club Fair, on the lawn" || fair.Location != "Great Lawn" || fair.URL != "https://example.com/fair" {
		t.Fatalf("fair: %+v", fair)
	}
	if fair.Start != "2026-09-11T14:00:00-04:00" || fair.End != "2026-09-11T16:00:00-04:00" {
		t.Fatalf("fair times: %s .. %s", fair.Start, fair.End)
	}
	if fair.Category != "campus" {
		t.Fatalf("category %q", fair.Category)
	}

	allDay := events[1]
	if allDay.Start != "2026-09-15T00:00:00-04:00" || allDay.End != "2026-09-15T23:59:00-04:00" {
		t.Fatalf("all-day times: %s .. %s", allDay.Start, allDay.End)
	}

	utc := events[2]
	if utc.Start != "2026-09-20T18:00:00Z" || utc.End != "2026-09-20T19:30:00Z" {
		t.Fatalf("utc times: %s .. %s", utc.Start, utc.End)
	}
}

func TestParseDuration(t *testing.T) {
	cases := map[string]time.Duration{
		"P1D":     24 * time.Hour,
		"PT2H":    2 * time.Hour,
		"PT30M":   30 * time.Minute,
		"PT1H30M": 90 * time.Minute,
		"P1W":     7 * 24 * time.Hour,
	}
	for in, want := range cases {
		if got := parseDuration(in); got != want {
			t.Errorf("%s: got %v want %v", in, got, want)
		}
	}
}
