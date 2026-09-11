package accounts

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"net/mail"
	"strings"
	"sync"
	"time"

	dicemail "github.com/dominicgodfrey/dice/server/internal/mail"
)

const (
	Domain          = "brandeis.edu"
	linkTTL         = 20 * time.Minute
	sessionTTL      = 180 * 24 * time.Hour
	requestCooldown = 60 * time.Second
	MaxBlob         = 64 << 10
)

var (
	ErrBadEmail  = errors.New("only brandeis.edu addresses can sign in")
	ErrTooSoon   = errors.New("a link was sent a moment ago; check your email")
	ErrBadToken  = errors.New("that link is invalid or has expired")
	ErrBlobShape = errors.New("preferences must be a JSON object under 64 KB")
)

// Service is sign-in and preference sync over a Store.
type Service struct {
	Store  Store
	Mailer dicemail.Sender
	// AppURL is where magic links point, e.g. https://dice.pages.dev.
	AppURL string
	// EchoLinks returns the link in the API response too, for development
	// without email. Never on in production.
	EchoLinks bool
	Now       func() time.Time

	mu       sync.Mutex
	lastSent map[string]time.Time
}

// NormalizeEmail lowercases and checks the domain.
func NormalizeEmail(raw string) (string, error) {
	addr, err := mail.ParseAddress(strings.TrimSpace(raw))
	if err != nil {
		return "", ErrBadEmail
	}
	email := strings.ToLower(addr.Address)
	at := strings.LastIndex(email, "@")
	if at < 1 || email[at+1:] != Domain {
		return "", ErrBadEmail
	}
	return email, nil
}

func newToken() (token, hash string, err error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", "", err
	}
	token = base64.RawURLEncoding.EncodeToString(b)
	return token, hashToken(token), nil
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func (s *Service) now() time.Time {
	if s.Now != nil {
		return s.Now()
	}
	return time.Now()
}

// RequestLink emails a sign-in link. Returns the link only when EchoLinks.
func (s *Service) RequestLink(ctx context.Context, rawEmail string) (string, error) {
	email, err := NormalizeEmail(rawEmail)
	if err != nil {
		return "", err
	}
	now := s.now()
	s.mu.Lock()
	if s.lastSent == nil {
		s.lastSent = map[string]time.Time{}
	}
	if t, ok := s.lastSent[email]; ok && now.Sub(t) < requestCooldown {
		s.mu.Unlock()
		return "", ErrTooSoon
	}
	s.lastSent[email] = now
	s.mu.Unlock()

	token, hash, err := newToken()
	if err != nil {
		return "", err
	}
	if err := s.Store.SaveMagicLink(ctx, hash, email, now.Add(linkTTL)); err != nil {
		return "", err
	}
	link := strings.TrimRight(s.AppURL, "/") + "/signin?token=" + token
	body := fmt.Sprintf(
		"Tap to sign in to Dice:\n\n%s\n\nThe link works once and expires in 20 minutes. If you did not ask for it, ignore this email.\n",
		link)
	if err := s.Mailer.Send(dicemail.Message{To: email, Subject: "Sign in to Dice", Body: body}); err != nil {
		return "", err
	}
	if s.EchoLinks {
		return link, nil
	}
	return "", nil
}

// Session is what a verified link yields.
type Session struct {
	Token   string    `json:"token"`
	Email   string    `json:"email"`
	Expires time.Time `json:"expires"`
}

// Verify consumes a magic link token and opens a session.
func (s *Service) Verify(ctx context.Context, token string) (Session, error) {
	if token == "" {
		return Session{}, ErrBadToken
	}
	now := s.now()
	email, err := s.Store.ConsumeMagicLink(ctx, hashToken(token), now)
	if errors.Is(err, ErrNotFound) {
		return Session{}, ErrBadToken
	}
	if err != nil {
		return Session{}, err
	}
	userID, err := s.Store.UpsertUser(ctx, email)
	if err != nil {
		return Session{}, err
	}
	stoken, shash, err := newToken()
	if err != nil {
		return Session{}, err
	}
	expires := now.Add(sessionTTL)
	if err := s.Store.SaveSession(ctx, shash, userID, expires); err != nil {
		return Session{}, err
	}
	return Session{Token: stoken, Email: email, Expires: expires}, nil
}

// Who returns the user behind a session token.
func (s *Service) Who(ctx context.Context, token string) (userID, email string, err error) {
	if token == "" {
		return "", "", ErrNotFound
	}
	return s.Store.GetSession(ctx, hashToken(token), s.now())
}

func (s *Service) SignOut(ctx context.Context, token string) error {
	if token == "" {
		return nil
	}
	return s.Store.DeleteSession(ctx, hashToken(token))
}

func (s *Service) GetPreferences(ctx context.Context, userID string) ([]byte, time.Time, error) {
	return s.Store.GetPreferences(ctx, userID)
}

// PutPreferences stores the blob after a shape check.
func (s *Service) PutPreferences(ctx context.Context, userID string, blob []byte) error {
	trimmed := strings.TrimSpace(string(blob))
	if len(blob) > MaxBlob || !strings.HasPrefix(trimmed, "{") || !strings.HasSuffix(trimmed, "}") {
		return ErrBlobShape
	}
	return s.Store.PutPreferences(ctx, userID, blob, s.now())
}
