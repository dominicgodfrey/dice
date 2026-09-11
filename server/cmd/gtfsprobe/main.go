// Command gtfsprobe prints the arrivals in a GTFS-Realtime TripUpdates
// feed, for showing Transportation the parser working against MBTA:
//
//	go run ./cmd/gtfsprobe https://cdn.mbta.com/realtime/TripUpdates.pb
package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/dominicgodfrey/dice/server/internal/gtfsrt"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "usage: gtfsprobe <TripUpdates URL>")
		os.Exit(2)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	arrivals, err := gtfsrt.Fetch(ctx, os.Args[1], time.Now())
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Printf("%d stop/route pairs\n", len(arrivals))
	for i, a := range arrivals {
		if i == 25 {
			fmt.Println("…")
			break
		}
		fmt.Printf("stop %-12s route %-8s in %v min\n", a.StopID, a.RouteID, a.Minutes)
	}
}
