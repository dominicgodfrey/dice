// Package bugreport stores bug reports from the app as JSON files and, when
// SMTP is configured, emails each one to the team (PLAN.md D21).
package bugreport

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/dominicgodfrey/dice/server/internal/mail"
)

const (
	MaxMessage = 4000
	MaxEmail   = 254
)

// Report is what the app posts.
type Report struct {
	Message string            `json:"message"`
	Email   string            `json:"email,omitempty"`
	Context map[string]string `json:"context,omitempty"`
	// SentryEventID links the report to the Sentry event the app captured.
	SentryEventID string `json:"sentryEventId,omitempty"`
}

// Stored is a report plus what the server adds.
type Stored struct {
	ID         string    `json:"id"`
	ReceivedAt time.Time `json:"receivedAt"`
	RemoteAddr string    `json:"remoteAddr,omitempty"`
	Report
}

// Validate trims and checks a report. Errors are safe to show the client.
func (r *Report) Validate() error {
	r.Message = strings.TrimSpace(r.Message)
	r.Email = strings.TrimSpace(r.Email)
	if r.Message == "" {
		return errors.New("message is required")
	}
	if utf8.RuneCountInString(r.Message) > MaxMessage {
		return fmt.Errorf("message is over %d characters", MaxMessage)
	}
	if len(r.Email) > MaxEmail || (r.Email != "" && !strings.Contains(r.Email, "@")) {
		return errors.New("email does not look right")
	}
	if len(r.Context) > 32 {
		return errors.New("too much context")
	}
	for k, v := range r.Context {
		if len(k) > 64 || len(v) > 1024 {
			return errors.New("context entry too long")
		}
	}
	return nil
}

// Store writes reports to a directory and optionally mails them to To.
type Store struct {
	Dir    string
	Mailer mail.Sender
	To     string
}

// Save writes the report and returns its ID. Mail failures are logged, not
// returned: the report is on disk either way.
func (s *Store) Save(r Report, remoteAddr string) (Stored, error) {
	if err := os.MkdirAll(s.Dir, 0o755); err != nil {
		return Stored{}, err
	}
	now := time.Now().UTC()
	st := Stored{
		ID:         now.Format("20060102T150405.000000000Z"),
		ReceivedAt: now,
		RemoteAddr: remoteAddr,
		Report:     r,
	}
	b, err := json.MarshalIndent(st, "", "  ")
	if err != nil {
		return Stored{}, err
	}
	path := filepath.Join(s.Dir, st.ID+".json")
	if err := os.WriteFile(path, b, 0o644); err != nil {
		return Stored{}, err
	}
	if s.Mailer != nil && s.To != "" {
		msg := mail.Message{To: s.To, Subject: "Dice bug report " + st.ID, Body: body(st)}
		if err := s.Mailer.Send(msg); err != nil {
			log.Printf("bugreport: mail failed for %s: %v", st.ID, err)
		}
	}
	return st, nil
}

func body(s Stored) string {
	var b strings.Builder
	b.WriteString(s.Message)
	b.WriteString("\n\n")
	if s.Email != "" {
		fmt.Fprintf(&b, "Reply to: %s\n", s.Email)
	}
	if s.SentryEventID != "" {
		fmt.Fprintf(&b, "Sentry event: %s\n", s.SentryEventID)
	}
	for k, v := range s.Context {
		fmt.Fprintf(&b, "%s: %s\n", k, v)
	}
	return b.String()
}
