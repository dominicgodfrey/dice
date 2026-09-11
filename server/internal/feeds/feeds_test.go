package feeds

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

const sampleICS = "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:a\r\nSUMMARY:Fair\r\nDTSTART:20260911T180000Z\r\nDTEND:20260911T200000Z\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n"

func TestEventsFetchesAndTags(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(sampleICS))
	}))
	defer srv.Close()
	c := Events("academic="+srv.URL+","+srv.URL, time.UTC)
	if c == nil {
		t.Fatal("nil cache")
	}
	b, err := c.Fetch(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	var v struct {
		Source string
		Events []struct{ Title, Category string }
	}
	if err := json.Unmarshal(b, &v); err != nil {
		t.Fatal(err)
	}
	if v.Source != "ics" || len(v.Events) != 2 {
		t.Fatalf("%+v", v)
	}
	if v.Events[0].Category != "academic" || v.Events[1].Category != "campus" {
		t.Fatalf("categories: %+v", v.Events)
	}
}

func TestEventsEmptySpec(t *testing.T) {
	if Events("", time.UTC) != nil || Events(" , ", time.UTC) != nil {
		t.Fatal("expected nil for an empty spec")
	}
}

func TestMenusRejectsWrongShape(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"nope":1}`))
	}))
	defer srv.Close()
	if _, err := Menus(srv.URL).Fetch(context.Background()); err == nil {
		t.Fatal("expected an error")
	}
}

func TestMenusAcceptsShape(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"halls":{"sherman":{"Lunch":[]}}}`))
	}))
	defer srv.Close()
	b, err := Menus(srv.URL).Fetch(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	var v map[string]any
	_ = json.Unmarshal(b, &v)
	if v["source"] != "url" || v["halls"] == nil {
		t.Fatalf("%v", v)
	}
}
