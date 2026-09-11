// Package bugreport stores bug reports from the app as JSON files and, when
// SMTP is configured, emails each one to the team (PLAN.md D21).
package bugreport

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/smtp"
	"os"
	"path/filepath"
	"strings"
	"time"
	"unicode/utf8"
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

// Mailer sends a stored report somewhere. Nil means store only.
type Mailer interface {
	Send(s Stored) error
}

// Store writes reports to a directory and optionally mails them.
type Store struct {
	Dir    string
	Mailer Mailer
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
	if s.Mailer != nil {
		if err := s.Mailer.Send(st); err != nil {
			log.Printf("bugreport: mail failed for %s: %v", st.ID, err)
		}
	}
	return st, nil
}

// SMTPMailer sends through a plain SMTP relay with PLAIN auth. STARTTLS is
// used when the server offers it (net/smtp does this by itself).
type SMTPMailer struct {
	Host, Port, User, Pass string
	From, To               string
}

// SMTPFromEnv builds a mailer from SMTP_HOST, SMTP_PORT, SMTP_USER,
// SMTP_PASS, BUG_REPORT_FROM and BUG_REPORT_TO. Returns nil when the host
// or recipient is missing, so a bare deployment still stores reports.
func SMTPFromEnv() *SMTPMailer {
	m := &SMTPMailer{
		Host: os.Getenv("SMTP_HOST"),
		Port: os.Getenv("SMTP_PORT"),
		User: os.Getenv("SMTP_USER"),
		Pass: os.Getenv("SMTP_PASS"),
		From: os.Getenv("BUG_REPORT_FROM"),
		To:   os.Getenv("BUG_REPORT_TO"),
	}
	if m.Host == "" || m.To == "" {
		return nil
	}
	if m.Port == "" {
		m.Port = "587"
	}
	if m.From == "" {
		m.From = m.User
	}
	return m
}

func (m *SMTPMailer) Send(s Stored) error {
	var body strings.Builder
	fmt.Fprintf(&body, "From: Dice <%s>\r\n", m.From)
	fmt.Fprintf(&body, "To: %s\r\n", m.To)
	fmt.Fprintf(&body, "Subject: Dice bug report %s\r\n", s.ID)
	body.WriteString("MIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n")
	body.WriteString(s.Message)
	body.WriteString("\r\n\r\n")
	if s.Email != "" {
		fmt.Fprintf(&body, "Reply to: %s\r\n", s.Email)
	}
	if s.SentryEventID != "" {
		fmt.Fprintf(&body, "Sentry event: %s\r\n", s.SentryEventID)
	}
	for k, v := range s.Context {
		fmt.Fprintf(&body, "%s: %s\r\n", k, v)
	}
	var auth smtp.Auth
	if m.User != "" {
		auth = smtp.PlainAuth("", m.User, m.Pass, m.Host)
	}
	return smtp.SendMail(m.Host+":"+m.Port, auth, m.From, []string{m.To}, []byte(body.String()))
}
