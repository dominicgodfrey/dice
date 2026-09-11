package scrape

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
)

// LibCalBase is the library's LibCal instance; the hours API is public.
const (
	LibCalBase        = "https://calendar.library.brandeis.edu"
	LibCalMainLibrary = "6858"
)

// DayHours is one date's open ranges as ["HH:MM","HH:MM"] pairs; an empty
// list means closed that day.
type DayHours struct {
	Date   string
	Ranges [][2]string
}

// ParseLibCalGrid reads api_hours_grid.php JSON for one location.
func ParseLibCalGrid(b []byte) ([]DayHours, error) {
	var v map[string]struct {
		Weeks []map[string]struct {
			Date  string `json:"date"`
			Times struct {
				Status string `json:"status"`
				Hours  []struct {
					From string `json:"from"`
					To   string `json:"to"`
				} `json:"hours"`
			} `json:"times"`
		} `json:"weeks"`
	}
	if err := json.Unmarshal(b, &v); err != nil {
		return nil, fmt.Errorf("scrape: libcal: %w", err)
	}
	var out []DayHours
	for _, loc := range v {
		for _, week := range loc.Weeks {
			for _, day := range week {
				d := DayHours{Date: day.Date}
				if day.Times.Status != "closed" {
					for _, h := range day.Times.Hours {
						from, err1 := ParseClock(h.From)
						to, err2 := ParseClock(h.To)
						if err1 == nil && err2 == nil {
							d.Ranges = append(d.Ranges, [2]string{from, to})
						}
					}
				}
				out = append(out, d)
			}
		}
	}
	if len(out) == 0 {
		return nil, fmt.Errorf("scrape: libcal grid had no days")
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Date < out[j].Date })
	return out, nil
}

// FetchLibCalWeeks downloads the grid for a location.
func FetchLibCalWeeks(ctx context.Context, client *http.Client, lid string, weeks int) ([]DayHours, error) {
	u := fmt.Sprintf("%s/api_hours_grid.php?iid=0&lid=%s&format=json&weeks=%d", LibCalBase, lid, weeks)
	body, err := get(ctx, client, u)
	if err != nil {
		return nil, err
	}
	defer body.Close()
	b, err := io.ReadAll(io.LimitReader(body, 1<<20))
	if err != nil {
		return nil, err
	}
	return ParseLibCalGrid(b)
}
