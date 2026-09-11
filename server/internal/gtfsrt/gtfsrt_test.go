package gtfsrt

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/MobilityData/gtfs-realtime-bindings/golang/gtfs"
	"google.golang.org/protobuf/proto"
)

func TestParseGroupsArrivals(t *testing.T) {
	now := time.Unix(1_800_000_000, 0)
	at := func(mins int) *gtfs.TripUpdate_StopTimeEvent {
		return &gtfs.TripUpdate_StopTimeEvent{Time: proto.Int64(now.Add(time.Duration(mins) * time.Minute).Unix())}
	}
	skipped := gtfs.TripUpdate_StopTimeUpdate_SKIPPED
	feed := &gtfs.FeedMessage{
		Header: &gtfs.FeedHeader{GtfsRealtimeVersion: proto.String("2.0")},
		Entity: []*gtfs.FeedEntity{
			{Id: proto.String("t1"), TripUpdate: &gtfs.TripUpdate{
				Trip: &gtfs.TripDescriptor{RouteId: proto.String("campus")},
				StopTimeUpdate: []*gtfs.TripUpdate_StopTimeUpdate{
					{StopId: proto.String("rabb"), Arrival: at(12)},
					{StopId: proto.String("usdan"), Arrival: at(15)},
					{StopId: proto.String("gone"), Arrival: at(-3)},
					{StopId: proto.String("skip"), Arrival: at(5), ScheduleRelationship: &skipped},
				},
			}},
			{Id: proto.String("t2"), TripUpdate: &gtfs.TripUpdate{
				Trip: &gtfs.TripDescriptor{RouteId: proto.String("campus")},
				StopTimeUpdate: []*gtfs.TripUpdate_StopTimeUpdate{
					{StopId: proto.String("rabb"), Departure: at(3)},
				},
			}},
			{Id: proto.String("v1"), Vehicle: &gtfs.VehiclePosition{}},
		},
	}
	b, err := proto.Marshal(feed)
	if err != nil {
		t.Fatal(err)
	}
	got, err := Parse(b, now)
	if err != nil {
		t.Fatal(err)
	}
	want := []Arrival{
		{StopID: "rabb", RouteID: "campus", Minutes: []int{3, 12}},
		{StopID: "usdan", RouteID: "campus", Minutes: []int{15}},
	}
	if len(got) != len(want) {
		t.Fatalf("got %+v", got)
	}
	for i := range want {
		if got[i].StopID != want[i].StopID || got[i].RouteID != want[i].RouteID || len(got[i].Minutes) != len(want[i].Minutes) {
			t.Fatalf("got %+v want %+v", got, want)
		}
		for j := range want[i].Minutes {
			if got[i].Minutes[j] != want[i].Minutes[j] {
				t.Fatalf("got %+v want %+v", got, want)
			}
		}
	}
}

func TestParseRejectsGarbage(t *testing.T) {
	if _, err := Parse([]byte{0xff, 0xff, 0xff}, time.Now()); err == nil {
		t.Fatal("expected an error")
	}
}

// TestLiveFeed runs only when GTFSRT_LIVE_URL is set, for example to
// https://cdn.mbta.com/realtime/TripUpdates.pb, so CI stays offline.
func TestLiveFeed(t *testing.T) {
	url := os.Getenv("GTFSRT_LIVE_URL")
	if url == "" {
		t.Skip("GTFSRT_LIVE_URL not set")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	arrivals, err := Fetch(ctx, url, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if len(arrivals) == 0 {
		t.Fatal("no arrivals in live feed")
	}
	t.Logf("%d stop/route pairs; first %+v", len(arrivals), arrivals[0])
}
