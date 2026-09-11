package accounts

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Postgres is the real Store (PLAN.md D7: the database arrives with
// accounts). Migrate creates the tables; there is nothing to version yet.
type Postgres struct{ pool *pgxpool.Pool }

func OpenPostgres(ctx context.Context, url string) (*Postgres, error) {
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	return &Postgres{pool: pool}, nil
}

func (p *Postgres) Close() { p.pool.Close() }

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id         BIGSERIAL PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS magic_links (
  token_hash TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS preferences (
  user_id    BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  blob       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
`

func (p *Postgres) Migrate(ctx context.Context) error {
	_, err := p.pool.Exec(ctx, schema)
	return err
}

func (p *Postgres) SaveMagicLink(ctx context.Context, hash, email string, expires time.Time) error {
	_, err := p.pool.Exec(ctx,
		`INSERT INTO magic_links (token_hash, email, expires_at) VALUES ($1, $2, $3)`, hash, email, expires)
	return err
}

func (p *Postgres) ConsumeMagicLink(ctx context.Context, hash string, now time.Time) (string, error) {
	var email string
	err := p.pool.QueryRow(ctx,
		`UPDATE magic_links SET used_at = $2
		 WHERE token_hash = $1 AND used_at IS NULL AND expires_at > $2
		 RETURNING email`, hash, now).Scan(&email)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	return email, err
}

func (p *Postgres) UpsertUser(ctx context.Context, email string) (string, error) {
	var id int64
	err := p.pool.QueryRow(ctx,
		`INSERT INTO users (email) VALUES ($1)
		 ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
		 RETURNING id`, email).Scan(&id)
	if err != nil {
		return "", err
	}
	return itoa(int(id)), nil
}

func (p *Postgres) SaveSession(ctx context.Context, hash, userID string, expires time.Time) error {
	_, err := p.pool.Exec(ctx,
		`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2::bigint, $3)`, hash, userID, expires)
	return err
}

func (p *Postgres) GetSession(ctx context.Context, hash string, now time.Time) (string, string, error) {
	var id int64
	var email string
	err := p.pool.QueryRow(ctx,
		`SELECT u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id
		 WHERE s.token_hash = $1 AND s.expires_at > $2`, hash, now).Scan(&id, &email)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", "", ErrNotFound
	}
	if err != nil {
		return "", "", err
	}
	return itoa(int(id)), email, nil
}

func (p *Postgres) DeleteSession(ctx context.Context, hash string) error {
	_, err := p.pool.Exec(ctx, `DELETE FROM sessions WHERE token_hash = $1`, hash)
	return err
}

func (p *Postgres) GetPreferences(ctx context.Context, userID string) ([]byte, time.Time, error) {
	var blob []byte
	var at time.Time
	err := p.pool.QueryRow(ctx,
		`SELECT blob, updated_at FROM preferences WHERE user_id = $1::bigint`, userID).Scan(&blob, &at)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, time.Time{}, ErrNotFound
	}
	return blob, at, err
}

func (p *Postgres) PutPreferences(ctx context.Context, userID string, blob []byte, now time.Time) error {
	_, err := p.pool.Exec(ctx,
		`INSERT INTO preferences (user_id, blob, updated_at) VALUES ($1::bigint, $2, $3)
		 ON CONFLICT (user_id) DO UPDATE SET blob = EXCLUDED.blob, updated_at = EXCLUDED.updated_at`,
		userID, blob, now)
	return err
}
