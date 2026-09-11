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
package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/dominicgodfrey/dice/server/internal/api"
	"github.com/dominicgodfrey/dice/server/internal/bugreport"
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

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           api.New(api.Config{AllowedOrigins: origins, BugReports: store}),
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
