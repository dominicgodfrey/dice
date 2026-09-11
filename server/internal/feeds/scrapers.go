package feeds

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/dominicgodfrey/dice/server/fixtures"
	"github.com/dominicgodfrey/dice/server/internal/refresh"
	"github.com/dominicgodfrey/dice/server/internal/scrape"
)

// DefaultEventsSpec is the two public calendars (PLAN.md D40): the
// CampusGroups school-wide feed and the registrar's academic calendar.
const DefaultEventsSpec = "campus=https://campusgroups.brandeis.edu/ical/bru/ical_bru.ics," +
	"academic=https://calendar.google.com/calendar/ical/brandeis.edu_pocb06fq5pdm19dbpgujbvsuhk%40group.calendar.google.com/public/basic.ics"

var scrapeClient = &http.Client{Timeout: 25 * time.Second}

// VenuesFeed merges scraped hours into the venues fixture: today's dining
// periods and the library's next two weeks become dated exceptions, and
// the dining halls get today's meal list. The fetchers are fields so tests
// can stub them.
type VenuesFeed struct {
	Loc     *time.Location
	Dining  func(ctx context.Context, date string) ([]scrape.VenueHours, error)
	Library func(ctx context.Context) ([]scrape.DayHours, error)
	Now     func() time.Time
}

func NewVenuesFeed(loc *time.Location) *VenuesFeed {
	return &VenuesFeed{
		Loc: loc,
		Dining: func(ctx context.Context, date string) ([]scrape.VenueHours, error) {
			return scrape.FetchDiningHours(ctx, scrapeClient, date)
		},
		Library: func(ctx context.Context) ([]scrape.DayHours, error) {
			return scrape.FetchLibCalWeeks(ctx, scrapeClient, scrape.LibCalMainLibrary, 2)
		},
		Now: time.Now,
	}
}

type exception struct {
	Date  string      `json:"date"`
	Hours [][2]string `json:"hours"`
	Note  string      `json:"note,omitempty"`
}

type meal struct {
	Name  string `json:"name"`
	Start string `json:"start"`
	End   string `json:"end"`
}

// Build returns the venues JSON.
func (f *VenuesFeed) Build(ctx context.Context) ([]byte, error) {
	base, err := fixtures.Read("venues")
	if err != nil {
		return nil, err
	}
	var doc map[string]any
	if err := json.Unmarshal(base, &doc); err != nil {
		return nil, err
	}
	venues, _ := doc["venues"].([]any)
	byID := map[string]map[string]any{}
	for _, v := range venues {
		if m, ok := v.(map[string]any); ok {
			if id, ok := m["id"].(string); ok {
				byID[id] = m
			}
		}
	}
	today := f.Now().In(f.Loc).Format("2006-01-02")
	var sources []string

	if hours, err := f.Dining(ctx, today); err != nil {
		log.Printf("venues: dining hours failed, keeping fixture hours: %v", err)
	} else {
		perVenue := map[string][]scrape.Period{}
		for _, vh := range hours {
			id, ok := scrape.DiningVenueIDs[vh.Name]
			if !ok {
				continue
			}
			perVenue[id] = append(perVenue[id], vh.Periods...)
		}
		for id, periods := range perVenue {
			m, ok := byID[id]
			if !ok {
				continue
			}
			sort.Slice(periods, func(i, j int) bool { return periods[i].Open.Before(periods[j].Open) })
			ex := exception{Date: today, Note: "From brandeishospitality.com"}
			var meals []meal
			seenRange := map[[2]string]bool{}
			for _, p := range periods {
				r := [2]string{scrape.HHMM(p.Open, f.Loc), scrape.HHMM(p.Close, f.Loc)}
				// Two pages for one hall (Sherman's kosher and farm tables)
				// repeat the same periods; keep each range and meal once.
				if !seenRange[r] {
					seenRange[r] = true
					ex.Hours = append(ex.Hours, r)
				}
				if p.Label != "" && !strings.EqualFold(p.Label, "open") {
					// One meal is listed as several sittings (Sherman's brunch
					// has three); the tile wants its whole span once.
					merged := false
					for i := range meals {
						if meals[i].Name == p.Label {
							meals[i].Start = min(meals[i].Start, r[0])
							meals[i].End = max(meals[i].End, r[1])
							merged = true
							break
						}
					}
					if !merged {
						meals = append(meals, meal{Name: p.Label, Start: r[0], End: r[1]})
					}
				}
			}
			setException(m, ex)
			if len(meals) > 0 {
				m["todayMeals"] = meals
				m["todayDate"] = today
			}
		}
		sources = append(sources, "dining")
	}

	if days, err := f.Library(ctx); err != nil {
		log.Printf("venues: library hours failed, keeping fixture hours: %v", err)
	} else if m, ok := byID["goldfarb"]; ok {
		for _, d := range days {
			setException(m, exception{Date: d.Date, Hours: nonNil(d.Ranges), Note: "From LibCal"})
		}
		sources = append(sources, "libcal")
	}

	if len(sources) == 0 {
		return nil, fmt.Errorf("venues: every scrape failed")
	}
	doc["updated"] = f.Now().UTC().Format(time.RFC3339)
	doc["source"] = "scrape:" + join(sources)
	return json.Marshal(doc)
}

func nonNil(r [][2]string) [][2]string {
	if r == nil {
		return [][2]string{}
	}
	return r
}

func join(s []string) string {
	out := ""
	for i, x := range s {
		if i > 0 {
			out += "+"
		}
		out += x
	}
	return out
}

// setException replaces any exception for the same date.
func setException(venue map[string]any, ex exception) {
	var kept []any
	if list, ok := venue["exceptions"].([]any); ok {
		for _, e := range list {
			if em, ok := e.(map[string]any); ok && em["date"] == ex.Date {
				continue
			}
			kept = append(kept, e)
		}
	}
	if ex.Hours == nil {
		ex.Hours = [][2]string{}
	}
	kept = append(kept, ex)
	venue["exceptions"] = kept
}

// VenuesScrape is the cache around VenuesFeed.
func VenuesScrape(loc *time.Location) *refresh.Cache[[]byte] {
	f := NewVenuesFeed(loc)
	return &refresh.Cache[[]byte]{Name: "venues", Interval: 30 * time.Minute, Fetch: f.Build}
}

// MenusFeed scrapes the dining halls' location pages.
type MenusFeed struct {
	Loc      *time.Location
	Location func(ctx context.Context, slug, date string) (string, []scrape.MealMenu, error)
	Now      func() time.Time
}

func NewMenusFeed(loc *time.Location) *MenusFeed {
	return &MenusFeed{
		Loc: loc,
		Location: func(ctx context.Context, slug, date string) (string, []scrape.MealMenu, error) {
			return scrape.FetchDiningLocation(ctx, scrapeClient, slug, date)
		},
		Now: time.Now,
	}
}

func (f *MenusFeed) Build(ctx context.Context) ([]byte, error) {
	today := f.Now().In(f.Loc).Format("2006-01-02")
	halls := map[string]map[string][]scrape.Station{}
	var failures int
	for venue, slugs := range scrape.DiningMenuSlugs {
		for _, slug := range slugs {
			_, meals, err := f.Location(ctx, slug, today)
			if err != nil {
				log.Printf("menus: %s failed: %v", slug, err)
				failures++
				continue
			}
			if halls[venue] == nil {
				halls[venue] = map[string][]scrape.Station{}
			}
			for _, m := range meals {
				halls[venue][m.Meal] = mergeStations(halls[venue][m.Meal], m.Stations)
			}
		}
	}
	if len(halls) == 0 {
		return nil, fmt.Errorf("menus: every location page failed")
	}
	return json.Marshal(map[string]any{
		"updated": f.Now().UTC().Format(time.RFC3339),
		"source":  "scrape:dining",
		"date":    today,
		"halls":   halls,
	})
}

// mergeStations appends stations, folding one whose name is already present
// into it: a location page lists a station once per sitting of the same
// meal, and two pages of one hall can share a station.
func mergeStations(into []scrape.Station, add []scrape.Station) []scrape.Station {
	for _, s := range add {
		i := -1
		for j := range into {
			if into[j].Station == s.Station {
				i = j
				break
			}
		}
		if i < 0 {
			into = append(into, scrape.Station{Station: s.Station, Items: append([]string(nil), s.Items...)})
			continue
		}
		seen := map[string]bool{}
		for _, it := range into[i].Items {
			seen[it] = true
		}
		for _, it := range s.Items {
			if !seen[it] {
				into[i].Items = append(into[i].Items, it)
				seen[it] = true
			}
		}
	}
	return into
}

func MenusScrape(loc *time.Location) *refresh.Cache[[]byte] {
	f := NewMenusFeed(loc)
	return &refresh.Cache[[]byte]{Name: "menus", Interval: time.Hour, Fetch: f.Build}
}

// LaundryFeed reads every Brandeis room on LaundryView.
type LaundryFeed struct {
	School func(ctx context.Context) ([]scrape.Room, error)
	Room   func(ctx context.Context, id string) ([]scrape.Machine, error)
	Now    func() time.Time
}

func NewLaundryFeed() *LaundryFeed {
	return &LaundryFeed{
		School: func(ctx context.Context) ([]scrape.Room, error) {
			return scrape.FetchSchool(ctx, scrapeClient, scrape.LaundrySchool)
		},
		Room: func(ctx context.Context, id string) ([]scrape.Machine, error) {
			return scrape.FetchRoom(ctx, scrapeClient, id)
		},
		Now: time.Now,
	}
}

type laundryRoom struct {
	ID       string           `json:"id"`
	Name     string           `json:"name"`
	Machines []scrape.Machine `json:"machines"`
}

type laundryBuilding struct {
	ID    string        `json:"id"`
	Name  string        `json:"name"`
	Rooms []laundryRoom `json:"rooms"`
}

func (f *LaundryFeed) Build(ctx context.Context) ([]byte, error) {
	rooms, err := f.School(ctx)
	if err != nil {
		return nil, err
	}
	byCampus := map[string]*laundryBuilding{}
	var order []string
	var ok int
	for _, r := range rooms {
		machines, err := f.Room(ctx, r.ID)
		if err != nil {
			log.Printf("laundry: room %s (%s) failed: %v", r.ID, r.Name, err)
			continue
		}
		ok++
		if machines == nil {
			machines = []scrape.Machine{}
		}
		key := scrape.Slug(r.Campus)
		b := byCampus[key]
		if b == nil {
			b = &laundryBuilding{ID: key, Name: r.Campus}
			byCampus[key] = b
			order = append(order, key)
		}
		b.Rooms = append(b.Rooms, laundryRoom{ID: r.ID, Name: r.Name, Machines: machines})
	}
	if ok == 0 {
		return nil, fmt.Errorf("laundry: no room answered")
	}
	buildings := make([]laundryBuilding, 0, len(order))
	for _, k := range order {
		buildings = append(buildings, *byCampus[k])
	}
	return json.Marshal(map[string]any{
		"updated":   f.Now().UTC().Format(time.RFC3339),
		"source":    "scrape:laundryview",
		"buildings": buildings,
	})
}

func LaundryScrape() *refresh.Cache[[]byte] {
	f := NewLaundryFeed()
	return &refresh.Cache[[]byte]{Name: "laundry", Interval: 90 * time.Second, Fetch: f.Build}
}
