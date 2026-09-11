package scrape

import (
	"os"
	"testing"
	"time"
)

func open(t *testing.T, name string) *os.File {
	t.Helper()
	f, err := os.Open("testdata/" + name)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { f.Close() })
	return f
}

func TestParseClock(t *testing.T) {
	cases := map[string]string{"7:30am": "07:30", "10pm": "22:00", "2am": "02:00", "12pm": "12:00", "12am": "00:00", "11:00 PM": "23:00", "14:05": "14:05"}
	for in, want := range cases {
		got, err := ParseClock(in)
		if err != nil || got != want {
			t.Errorf("%q: got %q %v want %q", in, got, err, want)
		}
	}
	if _, err := ParseClock("noon"); err == nil {
		t.Error("expected error for noon")
	}
}

func TestParseDiningHours(t *testing.T) {
	venues, err := ParseDiningHours(open(t, "dining_hours.html"))
	if err != nil {
		t.Fatal(err)
	}
	byName := map[string]VenueHours{}
	for _, v := range venues {
		byName[v.Name] = v
	}
	stein, ok := byName["The Stein"]
	if !ok || stein.Slug != "the-stein" || len(stein.Periods) != 1 {
		t.Fatalf("stein: %+v (have %d venues)", stein, len(venues))
	}
	ny, _ := time.LoadLocation("America/New_York")
	if HHMM(stein.Periods[0].Open, ny) != "17:00" || HHMM(stein.Periods[0].Close, ny) != "23:00" {
		t.Fatalf("stein times: %s-%s", HHMM(stein.Periods[0].Open, ny), HHMM(stein.Periods[0].Close, ny))
	}
	kosher := byName["Kosher Table at Sherman"]
	if len(kosher.Periods) < 2 || kosher.Periods[0].Label != "Brunch" {
		t.Fatalf("kosher: %+v", kosher.Periods)
	}
	if DiningVenueIDs[kosher.Name] != "sherman" || DiningVenueIDs[stein.Name] != "stein" {
		t.Fatal("venue id mapping")
	}
}

func TestParseDiningLocation(t *testing.T) {
	venue, meals, err := ParseDiningLocation(open(t, "dining_location.html"))
	if err != nil {
		t.Fatal(err)
	}
	if venue != "Sherman-Hassenfeld" {
		t.Fatalf("venue %q", venue)
	}
	if len(meals) != 2 || meals[0].Meal != "Brunch" || meals[1].Meal != "Brunch" {
		t.Fatalf("meals: %+v", meals)
	}
	var stations, items int
	for _, m := range meals {
		for _, s := range m.Stations {
			stations++
			items += len(s.Items)
			if s.Station == "" || len(s.Items) == 0 {
				t.Fatalf("empty station %+v", s)
			}
		}
	}
	if stations < 3 || items < 20 {
		t.Fatalf("stations %d items %d", stations, items)
	}
	found := false
	for _, s := range meals[0].Stations {
		for _, it := range s.Items {
			if it == "Scrambled Eggs" {
				found = true
			}
		}
	}
	if !found {
		t.Fatal("expected Scrambled Eggs in the first meal")
	}
}

func TestParseSchoolAndRoom(t *testing.T) {
	b, _ := os.ReadFile("testdata/laundry_school.json")
	rooms, err := ParseSchool(b)
	if err != nil {
		t.Fatal(err)
	}
	if len(rooms) != 24 {
		t.Fatalf("rooms %d", len(rooms))
	}
	var ziv *Room
	for i := range rooms {
		if rooms[i].ID == "141545" {
			ziv = &rooms[i]
		}
	}
	if ziv == nil || ziv.Campus != "Ziv" || ziv.Name != "Ziv 127" {
		t.Fatalf("ziv: %+v", ziv)
	}

	rb, _ := os.ReadFile("testdata/laundry_room.json")
	machines, err := ParseRoom(rb)
	if err != nil {
		t.Fatal(err)
	}
	// Foster Lower Apartments: 7 washers and 7 dryers, two pairs stacked.
	if len(machines) != 14 {
		t.Fatalf("machines %d: %+v", len(machines), machines)
	}
	byID := map[string]Machine{}
	for _, m := range machines {
		if m.Type != "washer" && m.Type != "dryer" {
			t.Fatalf("type %q", m.Type)
		}
		byID[m.ID] = m
	}
	if m := byID["04"]; m.Status != "in_use" || m.MinutesLeft == nil || *m.MinutesLeft != 34 {
		t.Fatalf("running washer: %+v", m)
	}
	if m := byID["01"]; m.Status != "out_of_order" {
		t.Fatalf("out of service: %+v", m)
	}
	if m := byID["14"]; m.Status != "in_use" || m.MinutesLeft != nil {
		t.Fatalf("extended cycle: %+v", m)
	}
	if m := byID["10"]; m.Type != "dryer" || m.Status != "out_of_order" {
		t.Fatalf("upper half of stacked dryer: %+v", m)
	}
	if m := byID["12"]; m.Type != "dryer" || m.Status != "available" {
		t.Fatalf("upper half of stacked dryer: %+v", m)
	}
}

func TestMachineStatus(t *testing.T) {
	s, m := machineStatus("Available", 0, 0)
	if s != "available" || m != nil {
		t.Fatal("available")
	}
	s, m = machineStatus("12 min left", 1, 12)
	if s != "in_use" || m == nil || *m != 12 {
		t.Fatal("in use")
	}
	s, _ = machineStatus("Out of service", 3, 0)
	if s != "out_of_order" {
		t.Fatal("oos")
	}
	s, m = machineStatus("", 1, 7)
	if s != "in_use" || m == nil || *m != 7 {
		t.Fatal("toggle fallback")
	}
	s, m = machineStatus("Ext. Cycle", 2, 0)
	if s != "in_use" || m != nil {
		t.Fatal("extended cycle")
	}
	s, _ = machineStatus("Offline", 4, 40)
	if s != "offline" {
		t.Fatal("offline")
	}
}

func TestParseLibCalGrid(t *testing.T) {
	b, _ := os.ReadFile("testdata/libcal_grid.json")
	days, err := ParseLibCalGrid(b)
	if err != nil {
		t.Fatal(err)
	}
	if len(days) != 14 {
		t.Fatalf("days %d", len(days))
	}
	var mon *DayHours
	for i := range days {
		if days[i].Date == "2026-09-07" {
			mon = &days[i]
		}
	}
	if mon == nil || len(mon.Ranges) != 1 || mon.Ranges[0] != [2]string{"07:30", "02:00"} {
		t.Fatalf("monday: %+v", mon)
	}
}
