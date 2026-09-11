// Package accounts is magic-link sign-in gated on brandeis.edu and the
// preferences blob an account owns (PLAN.md D20). Tokens are stored hashed.
package accounts

import (
	"context"
	"errors"
	"sync"
	"time"
)

var ErrNotFound = errors.New("accounts: not found")

// Store is what the service needs from a database. Postgres implements it
// for real; Mem implements it for tests and for development without one.
type Store interface {
	// SaveMagicLink records a hashed token for an email until expires.
	SaveMagicLink(ctx context.Context, tokenHash, email string, expires time.Time) error
	// ConsumeMagicLink returns the email for an unused, unexpired token and
	// marks it used; ErrNotFound otherwise.
	ConsumeMagicLink(ctx context.Context, tokenHash string, now time.Time) (string, error)
	// UpsertUser returns the user ID for an email, creating it if new.
	UpsertUser(ctx context.Context, email string) (string, error)
	SaveSession(ctx context.Context, tokenHash, userID string, expires time.Time) error
	// GetSession returns the user ID and email for a live session.
	GetSession(ctx context.Context, tokenHash string, now time.Time) (userID, email string, err error)
	DeleteSession(ctx context.Context, tokenHash string) error
	GetPreferences(ctx context.Context, userID string) (blob []byte, updatedAt time.Time, err error)
	PutPreferences(ctx context.Context, userID string, blob []byte, now time.Time) error
}

// Mem is an in-memory Store.
type Mem struct {
	mu       sync.Mutex
	links    map[string]memLink
	users    map[string]string // email -> id
	emails   map[string]string // id -> email
	sessions map[string]memSession
	prefs    map[string]memPrefs
	nextID   int
}

type memLink struct {
	email   string
	expires time.Time
	used    bool
}
type memSession struct {
	userID  string
	expires time.Time
}
type memPrefs struct {
	blob      []byte
	updatedAt time.Time
}

func NewMem() *Mem {
	return &Mem{
		links:    map[string]memLink{},
		users:    map[string]string{},
		emails:   map[string]string{},
		sessions: map[string]memSession{},
		prefs:    map[string]memPrefs{},
	}
}

func (m *Mem) SaveMagicLink(_ context.Context, hash, email string, expires time.Time) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.links[hash] = memLink{email: email, expires: expires}
	return nil
}

func (m *Mem) ConsumeMagicLink(_ context.Context, hash string, now time.Time) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	l, ok := m.links[hash]
	if !ok || l.used || now.After(l.expires) {
		return "", ErrNotFound
	}
	l.used = true
	m.links[hash] = l
	return l.email, nil
}

func (m *Mem) UpsertUser(_ context.Context, email string) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if id, ok := m.users[email]; ok {
		return id, nil
	}
	m.nextID++
	id := "u" + itoa(m.nextID)
	m.users[email] = id
	m.emails[id] = email
	return id, nil
}

func (m *Mem) SaveSession(_ context.Context, hash, userID string, expires time.Time) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.sessions[hash] = memSession{userID: userID, expires: expires}
	return nil
}

func (m *Mem) GetSession(_ context.Context, hash string, now time.Time) (string, string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	s, ok := m.sessions[hash]
	if !ok || now.After(s.expires) {
		return "", "", ErrNotFound
	}
	return s.userID, m.emails[s.userID], nil
}

func (m *Mem) DeleteSession(_ context.Context, hash string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.sessions, hash)
	return nil
}

func (m *Mem) GetPreferences(_ context.Context, userID string) ([]byte, time.Time, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	p, ok := m.prefs[userID]
	if !ok {
		return nil, time.Time{}, ErrNotFound
	}
	return p.blob, p.updatedAt, nil
}

func (m *Mem) PutPreferences(_ context.Context, userID string, blob []byte, now time.Time) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.prefs[userID] = memPrefs{blob: append([]byte(nil), blob...), updatedAt: now}
	return nil
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var b [20]byte
	i := len(b)
	for n > 0 {
		i--
		b[i] = byte('0' + n%10)
		n /= 10
	}
	return string(b[i:])
}
