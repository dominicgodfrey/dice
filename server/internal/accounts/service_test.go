package accounts

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/dominicgodfrey/dice/server/internal/mail"
)

type capture struct{ last mail.Message }

func (c *capture) Send(m mail.Message) error {
	c.last = m
	return nil
}

func newService(now *time.Time) (*Service, *capture) {
	c := &capture{}
	return &Service{
		Store:     NewMem(),
		Mailer:    c,
		AppURL:    "https://dice.test/",
		EchoLinks: true,
		Now:       func() time.Time { return *now },
	}, c
}

func TestNormalizeEmail(t *testing.T) {
	good := []string{"Dom@Brandeis.edu", " dom@brandeis.edu ", "Dom Godfrey <dom@brandeis.edu>"}
	for _, g := range good {
		if e, err := NormalizeEmail(g); err != nil || e != "dom@brandeis.edu" {
			t.Fatalf("%q: %q %v", g, e, err)
		}
	}
	bad := []string{"dom@gmail.com", "dom@brandeis.edu.evil.com", "dom@sub.brandeis.edu", "nope", "@brandeis.edu"}
	for _, b := range bad {
		if _, err := NormalizeEmail(b); !errors.Is(err, ErrBadEmail) {
			t.Fatalf("%q should be rejected, got %v", b, err)
		}
	}
}

func TestSignInFlow(t *testing.T) {
	now := time.Date(2026, 9, 11, 12, 0, 0, 0, time.UTC)
	svc, mails := newService(&now)
	ctx := context.Background()

	link, err := svc.RequestLink(ctx, "Student@brandeis.edu")
	if err != nil {
		t.Fatal(err)
	}
	if !strings.HasPrefix(link, "https://dice.test/signin?token=") || !strings.Contains(mails.last.Body, link) {
		t.Fatalf("link %q mail %q", link, mails.last.Body)
	}
	if mails.last.To != "student@brandeis.edu" {
		t.Fatalf("mailed to %q", mails.last.To)
	}
	// A second request straight away is refused.
	if _, err := svc.RequestLink(ctx, "student@brandeis.edu"); !errors.Is(err, ErrTooSoon) {
		t.Fatalf("expected cooldown, got %v", err)
	}

	token := strings.TrimPrefix(link, "https://dice.test/signin?token=")
	sess, err := svc.Verify(ctx, token)
	if err != nil {
		t.Fatal(err)
	}
	if sess.Email != "student@brandeis.edu" || sess.Token == "" {
		t.Fatalf("%+v", sess)
	}
	// The link works once.
	if _, err := svc.Verify(ctx, token); !errors.Is(err, ErrBadToken) {
		t.Fatalf("expected used token to fail, got %v", err)
	}

	userID, email, err := svc.Who(ctx, sess.Token)
	if err != nil || email != "student@brandeis.edu" || userID == "" {
		t.Fatalf("who: %q %q %v", userID, email, err)
	}

	if err := svc.PutPreferences(ctx, userID, []byte(`{"version":1,"order":["sky"]}`)); err != nil {
		t.Fatal(err)
	}
	if err := svc.PutPreferences(ctx, userID, []byte(`[1,2]`)); !errors.Is(err, ErrBlobShape) {
		t.Fatalf("expected shape error, got %v", err)
	}
	blob, at, err := svc.GetPreferences(ctx, userID)
	if err != nil || string(blob) != `{"version":1,"order":["sky"]}` || !at.Equal(now) {
		t.Fatalf("prefs: %s %v %v", blob, at, err)
	}

	if err := svc.SignOut(ctx, sess.Token); err != nil {
		t.Fatal(err)
	}
	if _, _, err := svc.Who(ctx, sess.Token); !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected signed out, got %v", err)
	}
}

func TestLinkExpires(t *testing.T) {
	now := time.Date(2026, 9, 11, 12, 0, 0, 0, time.UTC)
	svc, _ := newService(&now)
	ctx := context.Background()
	link, _ := svc.RequestLink(ctx, "a@brandeis.edu")
	token := strings.TrimPrefix(link, "https://dice.test/signin?token=")
	now = now.Add(21 * time.Minute)
	if _, err := svc.Verify(ctx, token); !errors.Is(err, ErrBadToken) {
		t.Fatalf("expected expired, got %v", err)
	}
}
