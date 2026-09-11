package scrape

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

// LaundryBase is CSC ServiceWorks' LaundryView. Brandeis is school 60.
const (
	LaundryBase   = "https://www.laundryview.com"
	LaundrySchool = "60"
)

// Room is one laundry room from the school record.
type Room struct {
	ID       string
	Campus   string
	Name     string
	Online   bool
	Washers  int
	Dryers   int
	Location string
}

// ParseSchool reads /api/c_room?loc=<school>: the room list and, per room,
// how many machines are free right now.
func ParseSchool(b []byte) ([]Room, error) {
	var v struct {
		RoomData []struct {
			Campus   string `json:"campus_name"`
			Location string `json:"laundry_room_location"`
			Name     string `json:"laundry_room_name"`
			Online   int    `json:"online"`
		} `json:"room_data"`
	}
	if err := json.Unmarshal(b, &v); err != nil {
		return nil, fmt.Errorf("scrape: laundry school: %w", err)
	}
	if len(v.RoomData) == 0 {
		return nil, fmt.Errorf("scrape: laundry school record has no rooms")
	}
	var out []Room
	for _, r := range v.RoomData {
		out = append(out, Room{
			ID:       r.Location,
			Campus:   titleCase(strings.ToLower(strings.Join(strings.Fields(r.Campus), " "))),
			Name:     titleCase(strings.ToLower(strings.Join(strings.Fields(r.Name), " "))),
			Online:   r.Online != 0,
			Location: r.Location,
		})
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Campus != out[j].Campus {
			return out[i].Campus < out[j].Campus
		}
		return out[i].Name < out[j].Name
	})
	return out, nil
}

// Machine is one appliance in the app's shape.
type Machine struct {
	ID          string `json:"id"`
	Type        string `json:"type"`
	Status      string `json:"status"`
	MinutesLeft *int   `json:"minutesLeft"`
}

var minRe = regexp.MustCompile(`(?i)(\d+)\s*min`)

// ParseRoom reads /api/currentRoomData?location=<room>.
func ParseRoom(b []byte) ([]Machine, error) {
	var v struct {
		Objects []struct {
			ApplianceType string  `json:"appliance_type"`
			Desc          string  `json:"appliance_desc"`
			Key           string  `json:"appliance_desc_key"`
			StatusToggle  int     `json:"status_toggle"`
			TimeRemaining int     `json:"time_remaining"`
			TimeLeftLite  string  `json:"time_left_lite"`
			Percentage    float64 `json:"percentage"`
		} `json:"objects"`
	}
	if err := json.Unmarshal(b, &v); err != nil {
		return nil, fmt.Errorf("scrape: laundry room: %w", err)
	}
	var out []Machine
	for _, o := range v.Objects {
		var typ string
		switch o.ApplianceType {
		case "W":
			typ = "washer"
		case "D":
			typ = "dryer"
		default:
			continue
		}
		m := Machine{ID: o.Desc, Type: typ}
		if m.ID == "" {
			m.ID = o.Key
		}
		m.Status, m.MinutesLeft = machineStatus(o.TimeLeftLite, o.StatusToggle, o.TimeRemaining)
		out = append(out, m)
	}
	return out, nil
}

// machineStatus reads LaundryView's status text first, then its toggle.
// Toggle values seen: 0 available, 1 in use, 2 cycle ended (still busy),
// 3 out of service, 4 offline.
func machineStatus(lite string, toggle, remaining int) (string, *int) {
	l := strings.ToLower(lite)
	switch {
	case strings.Contains(l, "available"), strings.Contains(l, "open"):
		return "available", nil
	case strings.Contains(l, "offline"), strings.Contains(l, "out of"), strings.Contains(l, "not available"):
		return "out_of_order", nil
	}
	if m := minRe.FindStringSubmatch(l); m != nil {
		n, _ := strconv.Atoi(m[1])
		return "in_use", &n
	}
	switch toggle {
	case 0:
		return "available", nil
	case 3, 4:
		return "out_of_order", nil
	}
	if remaining > 0 {
		n := remaining
		return "in_use", &n
	}
	return "in_use", nil
}

// FetchSchool downloads the school record.
func FetchSchool(ctx context.Context, client *http.Client, school string) ([]Room, error) {
	body, err := get(ctx, client, LaundryBase+"/api/c_room?loc="+school)
	if err != nil {
		return nil, err
	}
	defer body.Close()
	b, err := io.ReadAll(io.LimitReader(body, 4<<20))
	if err != nil {
		return nil, err
	}
	return ParseSchool(b)
}

// FetchRoom downloads one room's machines.
func FetchRoom(ctx context.Context, client *http.Client, room string) ([]Machine, error) {
	body, err := get(ctx, client, LaundryBase+"/api/currentRoomData?location="+room)
	if err != nil {
		return nil, err
	}
	defer body.Close()
	b, err := io.ReadAll(io.LimitReader(body, 4<<20))
	if err != nil {
		return nil, err
	}
	return ParseRoom(b)
}
