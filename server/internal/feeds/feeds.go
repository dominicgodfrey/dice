// Package feeds builds the live sources that replace fixtures when they are
// configured (PLAN.md D5, D6, section 2). Each is a refresh.Cache of the
// JSON bytes the API serves; when a feed is not configured, or has never
// succeeded, the API falls through to the fixture.
//
// Environment:
//
//	EVENTS_ICS_URLS     comma-separated "category=url" pairs, e.g.
//	                    "campus=https://…/calendar.ics,academic=https://…"
//	                    A bare URL counts as campus. Refreshed hourly.
//	MENUS_JSON_URL      a URL returning menus in the app's shape. Until the
//	                    dining vendor's site is known there is no scraper;
//	                    see Menus below. Refreshed hourly.
//	SHUTTLE_GTFS_RT_URL a GTFS-Realtime TripUpdates feed. Its arrivals
//	                    replace the fixture's; routes and stops still come
//	                    from the fixture, so stop and route IDs must match.
//	                    Refreshed every 30 seconds.
//	SHUTTLE_GTFS_RT_VEHICLES_URL
//	                    the matching VehiclePositions feed, for the vans on
//	                    the map. Optional.
package feeds

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/dominicgodfrey/dice/server/fixtures"
	"github.com/dominicgodfrey/dice/server/internal/gtfsrt"
	"github.com/dominicgodfrey/dice/server/internal/ics"
	"github.com/dominicgodfrey/dice/server/internal/refresh"
)

// Provider serves the live copy of a fixture when there is one.
type Provider interface {
	Get() ([]byte, bool)
}

type cached struct{ c *refresh.Cache[[]byte] }

func (p cached) Get() ([]byte, bool) {
	b, _, ok := p.c.Get()
	return b, ok
}

// Start runs a cache and returns it as a Provider.
func Start(ctx context.Context, c *refresh.Cache[[]byte]) Provider {
	c.Start(ctx)
	return cached{c}
}

func get(ctx context.Context, url string, limit int64) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "dice-server (+https://github.com/dominicgodfrey/dice)")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%s returned %s", url, res.Status)
	}
	return io.ReadAll(io.LimitReader(res.Body, limit))
}

// Events builds the events cache from an EVENTS_ICS_URLS spec.
func Events(spec string, loc *time.Location) *refresh.Cache[[]byte] {
	type source struct{ category, url string }
	var sources []source
	for _, part := range strings.Split(spec, ",") {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		cat, url := "campus", part
		if i := strings.Index(part, "="); i > 0 && !strings.HasPrefix(part, "http") {
			cat, url = part[:i], part[i+1:]
		}
		sources = append(sources, source{cat, url})
	}
	if len(sources) == 0 {
		return nil
	}
	return &refresh.Cache[[]byte]{
		Name:     "events",
		Interval: time.Hour,
		Fetch: func(ctx context.Context) ([]byte, error) {
			var all []ics.Event
			for _, s := range sources {
				b, err := get(ctx, s.url, 8<<20)
				if err != nil {
					return nil, err
				}
				evs, err := ics.Parse(strings.NewReader(string(b)), s.category, loc)
				if err != nil {
					return nil, err
				}
				all = append(all, evs...)
			}
			sort.Slice(all, func(i, j int) bool { return all[i].Start < all[j].Start })
			if all == nil {
				all = []ics.Event{}
			}
			return json.Marshal(map[string]any{
				"updated": time.Now().UTC().Format(time.RFC3339),
				"source":  "ics",
				"events":  all,
			})
		},
	}
}

// Menus builds the menus cache from a URL serving the app's menus shape.
//
// The plan calls for an hourly scraper of the dining vendor's site (PLAN.md
// Phase 4). Which vendor, and what its pages look like, is an open
// question, so the scraper does not exist yet. This fetcher is the seam it
// plugs into: replace Fetch with one that downloads the vendor's page and
// builds the same JSON. Until then anything that can host a JSON file of
// the right shape, even a hand-edited one, makes the Food tile live.
func Menus(url string) *refresh.Cache[[]byte] {
	if url == "" {
		return nil
	}
	return &refresh.Cache[[]byte]{
		Name:     "menus",
		Interval: time.Hour,
		Fetch: func(ctx context.Context) ([]byte, error) {
			b, err := get(ctx, url, 4<<20)
			if err != nil {
				return nil, err
			}
			var v struct {
				Halls map[string]any `json:"halls"`
			}
			if err := json.Unmarshal(b, &v); err != nil || v.Halls == nil {
				return nil, fmt.Errorf("menus: %s is not in the menus shape", url)
			}
			var full map[string]any
			_ = json.Unmarshal(b, &full)
			full["updated"] = time.Now().UTC().Format(time.RFC3339)
			full["source"] = "url"
			return json.Marshal(full)
		},
	}
}

// Shuttle builds the shuttle cache: the fixture's routes and stops with
// arrivals from a GTFS-RT TripUpdates feed and, if given, vans from a
// VehiclePositions feed.
func Shuttle(url, vehiclesURL string) *refresh.Cache[[]byte] {
	if url == "" {
		return nil
	}
	return &refresh.Cache[[]byte]{
		Name:     "shuttle",
		Interval: 30 * time.Second,
		Fetch: func(ctx context.Context) ([]byte, error) {
			arrivals, err := gtfsrt.Fetch(ctx, url, time.Now())
			if err != nil {
				return nil, err
			}
			base, err := fixtures.Read("shuttle")
			if err != nil {
				return nil, err
			}
			var full map[string]any
			if err := json.Unmarshal(base, &full); err != nil {
				return nil, err
			}
			full["arrivals"] = arrivals
			if vehiclesURL != "" {
				if vehicles, err := gtfsrt.FetchVehicles(ctx, vehiclesURL); err == nil {
					full["vehicles"] = vehicles
				} else {
					log.Printf("shuttle: vehicles feed failed, keeping arrivals only: %v", err)
				}
			}
			full["updated"] = time.Now().UTC().Format(time.RFC3339)
			full["source"] = "gtfs-rt"
			return json.Marshal(full)
		},
	}
}
