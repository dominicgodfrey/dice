// Command server is the Dice backend (PLAN.md D5): fixtures over HTTP, bug
// reports in, and later the fetchers and accounts.
//
// Environment:
//
//	PORT              listen port, default 8080
//	ALLOWED_ORIGINS   comma-separated CORS origins, default "*"
//	BUG_REPORT_DIR    where reports are written, default ./data/bug-reports
//	SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, BUG_REPORT_FROM, BUG_REPORT_TO
//	                  when set, each report is also emailed
//	EVENTS_ICS_URLS   ICS calendars to serve as events; see internal/feeds
//	MENUS_JSON_URL    menus JSON to serve instead of the fixture
//	SHUTTLE_GTFS_RT_URL  GTFS-RT TripUpdates feed for BranVan arrivals
//	SHUTTLE_GTFS_RT_VEHICLES_URL  matching VehiclePositions feed, optional
//	TZ                the campus zone for floating ICS times, default America/New_York
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/dominicgodfrey/dice/server/internal/api"
	"github.com/dominicgodfrey/dice/server/internal/bugreport"
	"github.com/dominicgodfrey/dice/server/internal/feeds"
	"github.com/dominicgodfrey/dice/server/internal/refresh"
)

func main() {
	port := env("PORT", "8080")
	origins := strings.Split(env("ALLOWED_ORIGINS", "*"), ",")

	store := &bugreport.Store{
		Dir:    env("BUG_REPORT_DIR", "./data/bug-reports"),
		Mailer: nil,
	}
	if m := bugreport.SMTPFromEnv(); m != nil {
		store.Mailer = m
		log.Printf("bug reports will be emailed to %s via %s", m.To, m.Host)
	} else {
		log.Printf("bug reports stored in %s (no SMTP configured)", store.Dir)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	loc, err := time.LoadLocation(env("TZ", "America/New_York"))
	if err != nil {
		loc = time.Local
	}
	live := map[string]feeds.Provider{}
	start := func(name string, c *refresh.Cache[[]byte]) {
		if c == nil {
			log.Printf("%s: no live feed configured, serving the fixture", name)
			return
		}
		live[name] = feeds.Start(ctx, c)
		log.Printf("%s: live feed on, refreshing every %s", name, c.Interval)
	}
	start("events", feeds.Events(os.Getenv("EVENTS_ICS_URLS"), loc))
	start("menus", feeds.Menus(os.Getenv("MENUS_JSON_URL")))
	start("shuttle", feeds.Shuttle(os.Getenv("SHUTTLE_GTFS_RT_URL"), os.Getenv("SHUTTLE_GTFS_RT_VEHICLES_URL")))

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           api.New(api.Config{AllowedOrigins: origins, BugReports: store, Live: live}),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
	}
	log.Printf("dice server listening on :%s", port)
	log.Fatal(srv.ListenAndServe())
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
