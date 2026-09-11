package feeds

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/dominicgodfrey/dice/server/internal/scrape"
)

func TestVenuesFeedMergesExceptionsAndMeals(t *testing.T) {
	ny, _ := time.LoadLocation("America/New_York")
	now := time.Date(2026, 9, 11, 12, 0, 0, 0, ny)
	at := func(h, m int) time.Time { return time.Date(2026, 9, 11, h, m, 0, 0, ny) }
	f := &VenuesFeed{
		Loc: ny,
		Now: func() time.Time { return now },
		Dining: func(_ context.Context, date string) ([]scrape.VenueHours, error) {
			if date != "2026-09-11" {
				t.Fatalf("date %q", date)
			}
			return []scrape.VenueHours{
				{Name: "The Stein", Periods: []scrape.Period{{Label: "Open", Open: at(17, 0), Close: at(23, 0)}}},
				{Name: "Kosher Table at Sherman", Periods: []scrape.Period{{Label: "Brunch", Open: at(9, 30), Close: at(11, 0)}, {Label: "Brunch", Open: at(11, 0), Close: at(14, 30)}}},
				{Name: "Farm Table at Sherman", Periods: []scrape.Period{{Label: "Dinner", Open: at(17, 0), Close: at(20, 0)}, {Label: "Brunch", Open: at(9, 30), Close: at(11, 0)}}},
				{Name: "Starbucks", Periods: []scrape.Period{{Label: "open", Open: at(8, 0), Close: at(15, 30)}}},
				{Name: "Unknown Cafe", Periods: []scrape.Period{{Label: "Open", Open: at(9, 0), Close: at(10, 0)}}},
			}, nil
		},
		Library: func(context.Context) ([]scrape.DayHours, error) {
			return []scrape.DayHours{
				{Date: "2026-09-11", Ranges: [][2]string{{"07:30", "22:00"}}},
				{Date: "2026-09-12", Ranges: nil},
			}, nil
		},
	}
	b, err := f.Build(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	var doc struct {
		Source string
		Venues []struct {
			ID         string
			Exceptions []struct {
				Date  string
				Hours [][2]string
			}
			TodayMeals []struct{ Name, Start, End string }
			TodayDate  string
		}
	}
	if err := json.Unmarshal(b, &doc); err != nil {
		t.Fatal(err)
	}
	if doc.Source != "scrape:dining+libcal" {
		t.Fatalf("source %q", doc.Source)
	}
	find := func(id string) *struct {
		ID         string
		Exceptions []struct {
			Date  string
			Hours [][2]string
		}
		TodayMeals []struct{ Name, Start, End string }
		TodayDate  string
	} {
		for i := range doc.Venues {
			if doc.Venues[i].ID == id {
				return &doc.Venues[i]
			}
		}
		return nil
	}
	sherman := find("sherman")
	if sherman == nil || len(sherman.Exceptions) != 1 || len(sherman.Exceptions[0].Hours) != 3 {
		t.Fatalf("sherman: %+v", sherman)
	}
	if sherman.Exceptions[0].Hours[0] != [2]string{"09:30", "11:00"} || sherman.TodayDate != "2026-09-11" || len(sherman.TodayMeals) != 2 ||
		// Three brunch sittings become one brunch.
		sherman.TodayMeals[0] != (struct{ Name, Start, End string }{"Brunch", "09:30", "14:30"}) {
		t.Fatalf("sherman detail: %+v", sherman)
	}
	stein := find("stein")
	if stein == nil || len(stein.Exceptions) != 1 || len(stein.TodayMeals) != 0 {
		t.Fatalf("stein: %+v", stein)
	}
	lib := find("goldfarb")
	if lib == nil || len(lib.Exceptions) != 2 {
		t.Fatalf("library: %+v", lib)
	}
	for _, e := range lib.Exceptions {
		if e.Date == "2026-09-12" && len(e.Hours) != 0 {
			t.Fatalf("closed day should have no ranges: %+v", e)
		}
	}
}

func TestVenuesFeedSurvivesOneFailure(t *testing.T) {
	ny, _ := time.LoadLocation("America/New_York")
	f := &VenuesFeed{
		Loc:     ny,
		Now:     time.Now,
		Dining:  func(context.Context, string) ([]scrape.VenueHours, error) { return nil, errors.New("down") },
		Library: func(context.Context) ([]scrape.DayHours, error) { return []scrape.DayHours{{Date: "2026-09-11"}}, nil },
	}
	b, err := f.Build(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	var doc struct{ Source string }
	_ = json.Unmarshal(b, &doc)
	if doc.Source != "scrape:libcal" {
		t.Fatalf("source %q", doc.Source)
	}
	f.Library = func(context.Context) ([]scrape.DayHours, error) { return nil, errors.New("down") }
	if _, err := f.Build(context.Background()); err == nil {
		t.Fatal("expected failure when everything fails")
	}
}

func TestMenusFeedGroupsByVenueAndMeal(t *testing.T) {
	ny, _ := time.LoadLocation("America/New_York")
	f := &MenusFeed{
		Loc: ny,
		Now: time.Now,
		Location: func(_ context.Context, slug, _ string) (string, []scrape.MealMenu, error) {
			switch slug {
			case "the-farm-table-at-sherman":
				return "Sherman", []scrape.MealMenu{{Meal: "Brunch", Stations: []scrape.Station{{Station: "Grill", Items: []string{"Eggs"}}}}}, nil
			case "the-farm-table-at-sherman-2":
				return "Sherman", []scrape.MealMenu{{Meal: "Brunch", Stations: []scrape.Station{{Station: "Kosher", Items: []string{"Bagels"}}}}}, nil
			}
			return "", nil, errors.New("nope")
		},
	}
	b, err := f.Build(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	var doc struct {
		Halls map[string]map[string][]scrape.Station
	}
	_ = json.Unmarshal(b, &doc)
	if len(doc.Halls["sherman"]["Brunch"]) != 2 || doc.Halls["usdan"] != nil {
		t.Fatalf("%+v", doc.Halls)
	}
}

func TestMergeStationsFoldsRepeats(t *testing.T) {
	got := mergeStations(
		[]scrape.Station{{Station: "Grill", Items: []string{"Eggs"}}},
		[]scrape.Station{
			{Station: "Grill", Items: []string{"Eggs", "Bacon"}},
			{Station: "Desserts", Items: []string{"Pie"}},
			{Station: "Desserts", Items: []string{"Cake"}},
		},
	)
	if len(got) != 2 {
		t.Fatalf("%+v", got)
	}
	if strings.Join(got[0].Items, ",") != "Eggs,Bacon" || strings.Join(got[1].Items, ",") != "Pie,Cake" {
		t.Fatalf("%+v", got)
	}
}

func TestLaundryFeedGroupsRoomsByCampus(t *testing.T) {
	n := 12
	f := &LaundryFeed{
		Now: time.Now,
		School: func(context.Context) ([]scrape.Room, error) {
			return []scrape.Room{
				{ID: "1", Campus: "Ziv", Name: "Ziv 127"},
				{ID: "2", Campus: "Ziv", Name: "Ziv 128"},
				{ID: "3", Campus: "Massell Quad", Name: "Shapiro Hall"},
			}, nil
		},
		Room: func(_ context.Context, id string) ([]scrape.Machine, error) {
			if id == "2" {
				return nil, errors.New("offline")
			}
			return []scrape.Machine{{ID: "01", Type: "washer", Status: "in_use", MinutesLeft: &n}}, nil
		},
	}
	b, err := f.Build(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	var doc struct {
		Buildings []struct {
			ID    string
			Name  string
			Rooms []struct {
				ID       string
				Machines []struct{ MinutesLeft *int }
			}
		}
	}
	_ = json.Unmarshal(b, &doc)
	if len(doc.Buildings) != 2 || doc.Buildings[0].ID != "ziv" || len(doc.Buildings[0].Rooms) != 1 {
		t.Fatalf("%+v", doc.Buildings)
	}
	if *doc.Buildings[0].Rooms[0].Machines[0].MinutesLeft != 12 {
		t.Fatal("minutes")
	}
}
