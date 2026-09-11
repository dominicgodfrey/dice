package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/dominicgodfrey/dice/server/internal/bugreport"
)

func newTestHandler(t *testing.T) (http.Handler, string) {
	t.Helper()
	dir := t.TempDir()
	h := New(Config{
		AllowedOrigins: []string{"*"},
		BugReports:     &bugreport.Store{Dir: dir},
	})
	return h, dir
}

func TestHealthz(t *testing.T) {
	h, _ := newTestHandler(t)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/healthz", nil))
	if rec.Code != http.StatusOK || rec.Body.String() != "ok\n" {
		t.Fatalf("got %d %q", rec.Code, rec.Body.String())
	}
}

func TestFixturesAreValidJSON(t *testing.T) {
	h, _ := newTestHandler(t)
	for _, name := range []string{"venues", "laundry", "shuttle", "events"} {
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/v1/"+name, nil))
		if rec.Code != http.StatusOK {
			t.Fatalf("%s: status %d", name, rec.Code)
		}
		if ct := rec.Header().Get("Content-Type"); !strings.HasPrefix(ct, "application/json") {
			t.Fatalf("%s: content-type %q", name, ct)
		}
		var v map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &v); err != nil {
			t.Fatalf("%s: invalid JSON: %v", name, err)
		}
		if _, ok := v["updated"]; !ok {
			t.Fatalf("%s: missing updated", name)
		}
	}
}

func TestFixtureIndex(t *testing.T) {
	h, _ := newTestHandler(t)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/v1/fixtures", nil))
	var v struct{ Fixtures []string }
	if err := json.Unmarshal(rec.Body.Bytes(), &v); err != nil {
		t.Fatal(err)
	}
	if len(v.Fixtures) < 4 {
		t.Fatalf("expected at least 4 fixtures, got %v", v.Fixtures)
	}
}

func TestCORS(t *testing.T) {
	h, _ := newTestHandler(t)
	req := httptest.NewRequest(http.MethodOptions, "/api/v1/venues", nil)
	req.Header.Set("Origin", "https://dice.pages.dev")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("preflight status %d", rec.Code)
	}
	if rec.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Fatalf("missing allow-origin")
	}
}

func TestBugReportStored(t *testing.T) {
	h, dir := newTestHandler(t)
	body := `{"message":"The laundry tile shows 0 washers","email":"me@brandeis.edu","context":{"platform":"web"}}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/bug-reports", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("status %d: %s", rec.Code, rec.Body.String())
	}
	var resp struct{ ID string }
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil || resp.ID == "" {
		t.Fatalf("bad response %q", rec.Body.String())
	}
	b, err := os.ReadFile(filepath.Join(dir, resp.ID+".json"))
	if err != nil {
		t.Fatal(err)
	}
	var st bugreport.Stored
	if err := json.Unmarshal(b, &st); err != nil {
		t.Fatal(err)
	}
	if st.Message != "The laundry tile shows 0 washers" || st.Context["platform"] != "web" {
		t.Fatalf("stored wrong: %+v", st)
	}
}

func TestBugReportRejectsEmpty(t *testing.T) {
	h, _ := newTestHandler(t)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/bug-reports", strings.NewReader(`{"message":"   "}`))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestBugReportRejectsHuge(t *testing.T) {
	h, _ := newTestHandler(t)
	big := `{"message":"` + strings.Repeat("x", maxBody) + `"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/bug-reports", strings.NewReader(big))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("status %d", rec.Code)
	}
}
