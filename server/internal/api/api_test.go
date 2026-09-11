package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/dominicgodfrey/dice/server/internal/accounts"
	"github.com/dominicgodfrey/dice/server/internal/bugreport"
	"github.com/dominicgodfrey/dice/server/internal/feeds"
	"github.com/dominicgodfrey/dice/server/internal/mail"
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

type fakeLive struct {
	b  []byte
	ok bool
}

func (f fakeLive) Get() ([]byte, bool) { return f.b, f.ok }

func TestLiveOverridesFixture(t *testing.T) {
	h := New(Config{Live: map[string]feeds.Provider{
		"events":  fakeLive{[]byte(`{"updated":"x","events":[]}`), true},
		"shuttle": fakeLive{nil, false},
	}})
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/v1/events", nil))
	if rec.Header().Get("X-Dice-Source") != "live" || rec.Body.String() != `{"updated":"x","events":[]}` {
		t.Fatalf("live: %s %q", rec.Header().Get("X-Dice-Source"), rec.Body.String())
	}
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/v1/shuttle", nil))
	if rec.Header().Get("X-Dice-Source") != "fixture" {
		t.Fatalf("expected fixture fallback, got %s", rec.Header().Get("X-Dice-Source"))
	}
}

func TestAccountsOverHTTP(t *testing.T) {
	svc := &accounts.Service{Store: accounts.NewMem(), Mailer: mail.Logger{}, AppURL: "https://d.test", EchoLinks: true}
	h := New(Config{Accounts: svc})
	post := func(path, body, token string) *httptest.ResponseRecorder {
		req := httptest.NewRequest(http.MethodPost, path, strings.NewReader(body))
		if token != "" {
			req.Header.Set("Authorization", "Bearer "+token)
		}
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		return rec
	}
	rec := post("/api/v1/auth/request", `{"email":"x@gmail.com"}`, "")
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("gmail accepted: %d", rec.Code)
	}
	rec = post("/api/v1/auth/request", `{"email":"x@brandeis.edu"}`, "")
	if rec.Code != http.StatusAccepted {
		t.Fatalf("request: %d %s", rec.Code, rec.Body.String())
	}
	var out struct{ Link string }
	_ = json.Unmarshal(rec.Body.Bytes(), &out)
	token := out.Link[strings.Index(out.Link, "token=")+6:]
	rec = post("/api/v1/auth/verify", `{"token":"`+token+`"}`, "")
	if rec.Code != http.StatusOK {
		t.Fatalf("verify: %d %s", rec.Code, rec.Body.String())
	}
	var sess struct{ Token, Email string }
	_ = json.Unmarshal(rec.Body.Bytes(), &sess)
	if sess.Email != "x@brandeis.edu" || sess.Token == "" {
		t.Fatalf("session %+v", sess)
	}

	req := httptest.NewRequest(http.MethodPut, "/api/v1/preferences", strings.NewReader(`{"version":1}`))
	req.Header.Set("Authorization", "Bearer "+sess.Token)
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("put prefs: %d %s", rec.Code, rec.Body.String())
	}
	req = httptest.NewRequest(http.MethodGet, "/api/v1/preferences", nil)
	req.Header.Set("Authorization", "Bearer "+sess.Token)
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK || rec.Body.String() != `{"version":1}` || rec.Header().Get("X-Dice-Updated") == "" {
		t.Fatalf("get prefs: %d %q", rec.Code, rec.Body.String())
	}
	req = httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("me without token: %d", rec.Code)
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
