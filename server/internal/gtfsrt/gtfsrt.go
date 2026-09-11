// Package gtfsrt turns a GTFS-Realtime TripUpdates feed into the arrivals
// the BranVan tile reads (PLAN.md section 2). Built and tested against
// MBTA's public feed so it is ready the day Transportation shares the
// TripShot URL.
package gtfsrt

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"sort"
	"time"

	"github.com/MobilityData/gtfs-realtime-bindings/golang/gtfs"
	"google.golang.org/protobuf/proto"
)

// Vehicle is the app's shape for a van's position.
type Vehicle struct {
	ID         string  `json:"id"`
	RouteID    string  `json:"routeId"`
	Lat        float64 `json:"lat"`
	Lon        float64 `json:"lon"`
	NextStopID string  `json:"nextStopId,omitempty"`
}

// FetchVehicles downloads and parses a VehiclePositions feed.
func FetchVehicles(ctx context.Context, url string) ([]Vehicle, error) {
	b, err := download(ctx, url)
	if err != nil {
		return nil, err
	}
	return ParseVehicles(b)
}

// ParseVehicles decodes a FeedMessage's vehicle positions.
func ParseVehicles(b []byte) ([]Vehicle, error) {
	var feed gtfs.FeedMessage
	if err := proto.Unmarshal(b, &feed); err != nil {
		return nil, fmt.Errorf("gtfsrt: decode: %w", err)
	}
	var out []Vehicle
	for _, ent := range feed.GetEntity() {
		vp := ent.GetVehicle()
		if vp == nil || vp.GetPosition() == nil {
			continue
		}
		id := vp.GetVehicle().GetId()
		if id == "" {
			id = ent.GetId()
		}
		out = append(out, Vehicle{
			ID:         id,
			RouteID:    vp.GetTrip().GetRouteId(),
			Lat:        float64(vp.GetPosition().GetLatitude()),
			Lon:        float64(vp.GetPosition().GetLongitude()),
			NextStopID: vp.GetStopId(),
		})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	if out == nil {
		out = []Vehicle{}
	}
	return out, nil
}

// Arrival is the app's shape: minutes until each upcoming arrival of a
// route at a stop.
type Arrival struct {
	StopID  string `json:"stopId"`
	RouteID string `json:"routeId"`
	Minutes []int  `json:"minutes"`
}

// Fetch downloads and parses a TripUpdates feed.
func Fetch(ctx context.Context, url string, now time.Time) ([]Arrival, error) {
	b, err := download(ctx, url)
	if err != nil {
		return nil, err
	}
	return Parse(b, now)
}

func download(ctx context.Context, url string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("gtfsrt: %s returned %s", url, res.Status)
	}
	return io.ReadAll(io.LimitReader(res.Body, 32<<20))
}

// Parse decodes a FeedMessage and groups predicted arrivals by stop and
// route, soonest first, dropping anything already in the past.
func Parse(b []byte, now time.Time) ([]Arrival, error) {
	var feed gtfs.FeedMessage
	if err := proto.Unmarshal(b, &feed); err != nil {
		return nil, fmt.Errorf("gtfsrt: decode: %w", err)
	}
	type key struct{ stop, route string }
	minutes := map[key][]int{}
	for _, ent := range feed.GetEntity() {
		tu := ent.GetTripUpdate()
		if tu == nil {
			continue
		}
		route := tu.GetTrip().GetRouteId()
		for _, stu := range tu.GetStopTimeUpdate() {
			if stu.GetScheduleRelationship() == gtfs.TripUpdate_StopTimeUpdate_SKIPPED {
				continue
			}
			ts := stu.GetArrival().GetTime()
			if ts == 0 {
				ts = stu.GetDeparture().GetTime()
			}
			if ts == 0 {
				continue
			}
			mins := int(time.Unix(ts, 0).Sub(now).Round(time.Minute) / time.Minute)
			if mins < 0 {
				continue
			}
			k := key{stu.GetStopId(), route}
			minutes[k] = append(minutes[k], mins)
		}
	}
	out := make([]Arrival, 0, len(minutes))
	for k, m := range minutes {
		sort.Ints(m)
		out = append(out, Arrival{StopID: k.stop, RouteID: k.route, Minutes: m})
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].StopID != out[j].StopID {
			return out[i].StopID < out[j].StopID
		}
		return out[i].RouteID < out[j].RouteID
	})
	return out, nil
}
