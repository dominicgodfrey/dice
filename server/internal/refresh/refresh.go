// Package refresh is the cache every fetcher sits behind: fetch on a
// schedule, keep the last good value, and never let a failed fetch blank
// what was there (PLAN.md D6: degrade to stale, never to blank).
package refresh

import (
	"context"
	"log"
	"sync"
	"time"
)

// Cache holds the latest successful result of fetch.
type Cache[T any] struct {
	Name     string
	Interval time.Duration
	Fetch    func(ctx context.Context) (T, error)

	mu        sync.RWMutex
	value     T
	ok        bool
	updatedAt time.Time
}

// Start fetches now and then every Interval until ctx is done.
func (c *Cache[T]) Start(ctx context.Context) {
	go func() {
		c.tick(ctx)
		t := time.NewTicker(c.Interval)
		defer t.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-t.C:
				c.tick(ctx)
			}
		}
	}()
}

func (c *Cache[T]) tick(ctx context.Context) {
	fctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	v, err := c.Fetch(fctx)
	if err != nil {
		log.Printf("%s: refresh failed, keeping last value: %v", c.Name, err)
		return
	}
	c.mu.Lock()
	c.value, c.ok, c.updatedAt = v, true, time.Now()
	c.mu.Unlock()
	log.Printf("%s: refreshed", c.Name)
}

// Get returns the last good value, if any, and when it was fetched.
func (c *Cache[T]) Get() (T, time.Time, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.value, c.updatedAt, c.ok
}
