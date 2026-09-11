// Package api is the HTTP surface: fixtures over GET, bug reports over
// POST, a health check, and CORS for the web build (PLAN.md D5).
package api

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"net"
	"net/http"
	"strings"

	"github.com/dominicgodfrey/dice/server/fixtures"
	"github.com/dominicgodfrey/dice/server/internal/bugreport"
)

const maxBody = 64 << 10

// Config wires the handler.
type Config struct {
	// AllowedOrigins for CORS. "*" allows any; empty disables CORS headers.
	AllowedOrigins []string
	BugReports     *bugreport.Store
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
			b, err := fixtures.Read(name)
			if err != nil {
				http.Error(w, "not found", http.StatusNotFound)
				return
			}
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.Header().Set("Cache-Control", "public, max-age=300")
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

	return cors(cfg.AllowedOrigins, mux)
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
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.Header().Set("Access-Control-Max-Age", "600")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
