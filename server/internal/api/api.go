// Package api is the HTTP surface: fixtures over GET (or the live feed
// that replaces one), bug reports over POST, a health check, and CORS for
// the web build (PLAN.md D5, D6).
package api

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/dominicgodfrey/dice/server/fixtures"
	"github.com/dominicgodfrey/dice/server/internal/accounts"
	"github.com/dominicgodfrey/dice/server/internal/bugreport"
	"github.com/dominicgodfrey/dice/server/internal/feeds"
)

const maxBody = 64 << 10

// Config wires the handler.
type Config struct {
	// AllowedOrigins for CORS. "*" allows any; empty disables CORS headers.
	AllowedOrigins []string
	BugReports     *bugreport.Store
	// Live feeds by fixture name. Served instead of the fixture whenever
	// they have a value; the fixture is the fallback.
	Live map[string]feeds.Provider
	// Accounts enables sign-in and preference sync (D20). Nil disables.
	Accounts *accounts.Service
}

// New returns the root handler.
func New(cfg Config) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		_, _ = w.Write([]byte("ok\n"))
	})

	mux.HandleFunc("GET /api/v1/fixtures", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{"fixtures": fixtures.Names()})
	})

	for _, name := range fixtures.Names() {
		name := name
		mux.HandleFunc("GET /api/v1/"+name, func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			if p, ok := cfg.Live[name]; ok {
				if b, live := p.Get(); live {
					w.Header().Set("Cache-Control", "public, max-age=30")
					w.Header().Set("X-Dice-Source", "live")
					_, _ = w.Write(b)
					return
				}
			}
			b, err := fixtures.Read(name)
			if err != nil {
				http.Error(w, "not found", http.StatusNotFound)
				return
			}
			w.Header().Set("Cache-Control", "public, max-age=300")
			w.Header().Set("X-Dice-Source", "fixture")
			_, _ = w.Write(b)
		})
	}

	mux.HandleFunc("POST /api/v1/bug-reports", func(w http.ResponseWriter, r *http.Request) {
		if cfg.BugReports == nil {
			http.Error(w, "bug reports are not enabled", http.StatusServiceUnavailable)
			return
		}
		var rep bugreport.Report
		body := http.MaxBytesReader(w, r.Body, maxBody)
		if err := json.NewDecoder(body).Decode(&rep); err != nil {
			var tooBig *http.MaxBytesError
			if errors.As(err, &tooBig) {
				http.Error(w, "report too large", http.StatusRequestEntityTooLarge)
				return
			}
			http.Error(w, "bad JSON", http.StatusBadRequest)
			return
		}
		_, _ = io.Copy(io.Discard, body)
		if err := rep.Validate(); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		host, _, _ := net.SplitHostPort(r.RemoteAddr)
		st, err := cfg.BugReports.Save(rep, host)
		if err != nil {
			log.Printf("bug report save failed: %v", err)
			http.Error(w, "could not save", http.StatusInternalServerError)
			return
		}
		writeJSON(w, http.StatusCreated, map[string]string{"id": st.ID})
	})

	if cfg.Accounts != nil {
		mountAccounts(mux, cfg.Accounts)
	}

	return cors(cfg.AllowedOrigins, mux)
}

func bearer(r *http.Request) string {
	h := r.Header.Get("Authorization")
	if strings.HasPrefix(h, "Bearer ") {
		return strings.TrimSpace(h[len("Bearer "):])
	}
	return ""
}

func mountAccounts(mux *http.ServeMux, svc *accounts.Service) {
	mux.HandleFunc("POST /api/v1/auth/request", func(w http.ResponseWriter, r *http.Request) {
		var in struct {
			Email string `json:"email"`
		}
		if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4<<10)).Decode(&in); err != nil {
			http.Error(w, "bad JSON", http.StatusBadRequest)
			return
		}
		link, err := svc.RequestLink(r.Context(), in.Email)
		switch {
		case errors.Is(err, accounts.ErrBadEmail), errors.Is(err, accounts.ErrTooSoon):
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		case err != nil:
			log.Printf("auth request: %v", err)
			http.Error(w, "could not send the link", http.StatusInternalServerError)
			return
		}
		out := map[string]any{"sent": true}
		if link != "" {
			out["link"] = link
		}
		writeJSON(w, http.StatusAccepted, out)
	})

	mux.HandleFunc("POST /api/v1/auth/verify", func(w http.ResponseWriter, r *http.Request) {
		var in struct {
			Token string `json:"token"`
		}
		if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4<<10)).Decode(&in); err != nil {
			http.Error(w, "bad JSON", http.StatusBadRequest)
			return
		}
		sess, err := svc.Verify(r.Context(), in.Token)
		if errors.Is(err, accounts.ErrBadToken) {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}
		if err != nil {
			log.Printf("auth verify: %v", err)
			http.Error(w, "could not sign in", http.StatusInternalServerError)
			return
		}
		writeJSON(w, http.StatusOK, sess)
	})

	mux.HandleFunc("POST /api/v1/auth/signout", func(w http.ResponseWriter, r *http.Request) {
		_ = svc.SignOut(r.Context(), bearer(r))
		w.WriteHeader(http.StatusNoContent)
	})

	mux.HandleFunc("GET /api/v1/me", func(w http.ResponseWriter, r *http.Request) {
		_, email, err := svc.Who(r.Context(), bearer(r))
		if err != nil {
			http.Error(w, "signed out", http.StatusUnauthorized)
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"email": email})
	})

	mux.HandleFunc("GET /api/v1/preferences", func(w http.ResponseWriter, r *http.Request) {
		userID, _, err := svc.Who(r.Context(), bearer(r))
		if err != nil {
			http.Error(w, "signed out", http.StatusUnauthorized)
			return
		}
		blob, at, err := svc.GetPreferences(r.Context(), userID)
		if errors.Is(err, accounts.ErrNotFound) {
			http.Error(w, "no preferences yet", http.StatusNotFound)
			return
		}
		if err != nil {
			http.Error(w, "could not load", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.Header().Set("X-Dice-Updated", at.UTC().Format(time.RFC3339))
		_, _ = w.Write(blob)
	})

	mux.HandleFunc("PUT /api/v1/preferences", func(w http.ResponseWriter, r *http.Request) {
		userID, _, err := svc.Who(r.Context(), bearer(r))
		if err != nil {
			http.Error(w, "signed out", http.StatusUnauthorized)
			return
		}
		blob, err := io.ReadAll(http.MaxBytesReader(w, r.Body, accounts.MaxBlob+1))
		if err != nil {
			http.Error(w, "too large", http.StatusRequestEntityTooLarge)
			return
		}
		if err := svc.PutPreferences(r.Context(), userID, blob); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func cors(allowed []string, next http.Handler) http.Handler {
	if len(allowed) == 0 {
		return next
	}
	any := false
	set := map[string]bool{}
	for _, o := range allowed {
		o = strings.TrimSpace(o)
		if o == "*" {
			any = true
		} else if o != "" {
			set[o] = true
		}
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && (any || set[origin]) {
			if any {
				w.Header().Set("Access-Control-Allow-Origin", "*")
			} else {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Add("Vary", "Origin")
			}
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Expose-Headers", "X-Dice-Source, X-Dice-Updated")
			w.Header().Set("Access-Control-Max-Age", "600")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
