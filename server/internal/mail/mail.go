// Package mail sends plain-text email through an SMTP relay, or logs it
// when no relay is configured. Bug reports and magic links both use it.
package mail

import (
	"fmt"
	"log"
	"net/smtp"
	"os"
	"strings"
)

// Message is one plain-text email.
type Message struct {
	To      string
	Subject string
	Body    string
}

// Sender delivers messages somewhere.
type Sender interface {
	Send(m Message) error
}

// SMTP sends through a relay with PLAIN auth; STARTTLS is used when the
// relay offers it (net/smtp does this by itself).
type SMTP struct {
	Host, Port, User, Pass, From string
}

// FromEnv reads SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and MAIL_FROM
// (falling back to BUG_REPORT_FROM, then SMTP_USER). Nil when no host.
func FromEnv() *SMTP {
	m := &SMTP{
		Host: os.Getenv("SMTP_HOST"),
		Port: os.Getenv("SMTP_PORT"),
		User: os.Getenv("SMTP_USER"),
		Pass: os.Getenv("SMTP_PASS"),
		From: os.Getenv("MAIL_FROM"),
	}
	if m.Host == "" {
		return nil
	}
	if m.Port == "" {
		m.Port = "587"
	}
	if m.From == "" {
		m.From = os.Getenv("BUG_REPORT_FROM")
	}
	if m.From == "" {
		m.From = m.User
	}
	return m
}

func (m *SMTP) Send(msg Message) error {
	var b strings.Builder
	fmt.Fprintf(&b, "From: Dice <%s>\r\n", m.From)
	fmt.Fprintf(&b, "To: %s\r\n", msg.To)
	fmt.Fprintf(&b, "Subject: %s\r\n", msg.Subject)
	b.WriteString("MIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n")
	b.WriteString(msg.Body)
	var auth smtp.Auth
	if m.User != "" {
		auth = smtp.PlainAuth("", m.User, m.Pass, m.Host)
	}
	return smtp.SendMail(m.Host+":"+m.Port, auth, m.From, []string{msg.To}, []byte(b.String()))
}

// Logger prints messages instead of sending them, for development.
type Logger struct{}

func (Logger) Send(msg Message) error {
	log.Printf("mail (not sent, no SMTP): to=%s subject=%q\n%s", msg.To, msg.Subject, msg.Body)
	return nil
}
