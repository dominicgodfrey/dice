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
//	APP_URL           where magic links point, e.g. https://dice.pages.dev
//	DATABASE_URL      Postgres for accounts; unset means in-memory (dev only)
//	AUTH_ECHO_LINKS   "1" returns the magic link in the API response (dev only)
//	MAIL_FROM         sender address for all mail; falls back to BUG_REPORT_FROM
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/dominicgodfrey/dice/server/internal/accounts"
	"github.com/dominicgodfrey/dice/server/internal/api"
	"github.com/dominicgodfrey/dice/server/internal/bugreport"
	"github.com/dominicgodfrey/dice/server/internal/feeds"
	"github.com/dominicgodfrey/dice/server/internal/mail"
	"github.com/dominicgodfrey/dice/server/internal/refresh"
)

func main() {
	port := env("PORT", "8080")
	origins := strings.Split(env("ALLOWED_ORIGINS", "*"), ",")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	var mailer mail.Sender = mail.Logger{}
	if m := mail.FromEnv(); m != nil {
		mailer = m
		log.Printf("mail goes through %s as %s", m.Host, m.From)
	} else {
		log.Printf("no SMTP configured: mail is logged, not sent")
	}

	store := &bugreport.Store{
		Dir:    env("BUG_REPORT_DIR", "./data/bug-reports"),
		Mailer: mailer,
		To:     os.Getenv("BUG_REPORT_TO"),
	}
	log.Printf("bug reports stored in %s", store.Dir)

	auth := &accounts.Service{
		Mailer:    mailer,
		AppURL:    env("APP_URL", "http://localhost:8081"),
		EchoLinks: os.Getenv("AUTH_ECHO_LINKS") == "1",
	}
	if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
		pg, err := accounts.OpenPostgres(ctx, dsn)
		if err != nil {
			log.Fatalf("postgres: %v", err)
		}
		defer pg.Close()
		if err := pg.Migrate(ctx); err != nil {
			log.Fatalf("postgres migrate: %v", err)
		}
		auth.Store = pg
		log.Printf("accounts: postgres")
	} else {
		auth.Store = accounts.NewMem()
		log.Printf("accounts: in-memory store (no DATABASE_URL); sign-ins are lost on restart")
	}
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
		Handler:           api.New(api.Config{AllowedOrigins: origins, BugReports: store, Live: live, Accounts: auth}),
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
