package scrape

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"golang.org/x/net/html"
)

// DiningBase is the dining site. Hours live on /menu-hours/ as rows with
// epoch data attributes; menus live on /locations/<slug>/ as tabs per meal.
const DiningBase = "https://www.brandeishospitality.com"

// DiningVenueIDs maps the site's venue names to venues.json IDs.
var DiningVenueIDs = map[string]string{
	"The Stein":                "stein",
	"The Hoot":                 "hoot",
	"Dunkin'":                  "dunkin",
	"Dunkin":                   "dunkin",
	"Louis' Deli":              "louis",
	"The Hive Culinary Studio": "hive",
	"Einstein Bros. Bagels":    "einstein",
	"Starbucks":                "starbucks",
	"Kosher Table at Sherman":  "sherman",
	"Farm Table at Sherman":    "sherman",
	"Sherman-Hassenfeld":       "sherman",
	"Sherman":                  "sherman",
	"Usdan Kitchen":            "usdan",
	"Lower Usdan":              "usdan",
	"Greens & Grains":          "greens",
	"Greens &amp; Grains":      "greens",
}

// DiningMenuSlugs are the location pages that carry a menu, by venue ID.
var DiningMenuSlugs = map[string][]string{
	"sherman": {"the-farm-table-at-sherman", "the-farm-table-at-sherman-2"},
	"usdan":   {"lower-usdan"},
}

// Period is one open span on the hours page: "Open", or a meal name.
type Period struct {
	Label string
	Open  time.Time
	Close time.Time
}

// VenueHours is one venue's periods for the day the page shows.
type VenueHours struct {
	Name    string
	Slug    string
	Periods []Period
}

// ParseDiningHours reads the menu-hours page.
func ParseDiningHours(r io.Reader) ([]VenueHours, error) {
	doc, err := html.Parse(r)
	if err != nil {
		return nil, err
	}
	var out []VenueHours
	var walk func(n *html.Node)
	walk = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "tr" && hasClass(n, "location") {
			v := VenueHours{}
			each(n, func(c *html.Node) {
				if c.Data == "a" && hasClass(c, "open-now-location-link") {
					v.Name = strings.TrimSpace(text(c))
					v.Slug = slugFromHref(attr(c, "href"))
				}
				if c.Data == "div" && hasClass(c, "hours-row") {
					open, err1 := strconv.ParseInt(attr(c, "data-open"), 10, 64)
					cls, err2 := strconv.ParseInt(attr(c, "data-close"), 10, 64)
					if err1 == nil && err2 == nil {
						v.Periods = append(v.Periods, Period{
							Label: strings.TrimSpace(attr(c, "data-name")),
							Open:  time.Unix(open, 0),
							Close: time.Unix(cls, 0),
						})
					}
				}
			})
			if v.Name != "" {
				out = append(out, v)
			}
			return
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			walk(c)
		}
	}
	walk(doc)
	if len(out) == 0 {
		return nil, fmt.Errorf("scrape: no venues found on the hours page")
	}
	return out, nil
}

// Station is a menu station with its items, in the app's shape.
type Station struct {
	Station string   `json:"station"`
	Items   []string `json:"items"`
}

// MealMenu is one tab of a location page.
type MealMenu struct {
	Meal     string
	Stations []Station
}

// ParseDiningLocation reads a location page: the venue heading and one
// MealMenu per tab, in tab order. The tab label carries the meal name and
// its times, e.g. "Brunch (9:30am-11am)"; the name is what is kept.
func ParseDiningLocation(r io.Reader) (string, []MealMenu, error) {
	doc, err := html.Parse(r)
	if err != nil {
		return "", nil, err
	}
	var venue string
	var labels []string
	var tabs []*html.Node
	var walk func(n *html.Node)
	walk = func(n *html.Node) {
		if n.Type == html.ElementNode {
			switch {
			case n.Data == "h2" && hasClass(n, "location-header-venue"):
				venue = strings.TrimSpace(text(n))
			case n.Data == "a" && hasClass(n, "c-tabs-nav__link"):
				labels = append(labels, strings.TrimSpace(text(n)))
			case n.Data == "div" && hasClass(n, "c-tab") && !hasClass(n, "c-tab__content"):
				tabs = append(tabs, n)
				return
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			walk(c)
		}
	}
	walk(doc)
	var meals []MealMenu
	for i, tab := range tabs {
		name := "Menu"
		if i < len(labels) {
			name = mealName(labels[i])
		}
		m := MealMenu{Meal: name}
		each(tab, func(c *html.Node) {
			if c.Data == "div" && hasClass(c, "menu-station") {
				st := Station{}
				each(c, func(d *html.Node) {
					if d.Data == "h4" && hasClass(d, "toggle-menu-station-data") {
						st.Station = titleCase(strings.TrimSpace(text(d)))
					}
					if d.Data == "a" && hasClass(d, "show-nutrition") {
						if item := strings.TrimSpace(text(d)); item != "" {
							st.Items = append(st.Items, item)
						}
					}
				})
				if st.Station != "" && len(st.Items) > 0 {
					m.Stations = append(m.Stations, st)
				}
			}
		})
		meals = append(meals, m)
	}
	return venue, meals, nil
}

// mealName strips the "(9:30am-11am)" suffix from a tab label.
func mealName(label string) string {
	if i := strings.Index(label, "("); i > 0 {
		label = label[:i]
	}
	return strings.TrimSpace(label)
}

func slugFromHref(href string) string {
	href = strings.TrimSuffix(strings.SplitN(href, "?", 2)[0], "/")
	if i := strings.LastIndex(href, "/"); i >= 0 {
		return href[i+1:]
	}
	return href
}

// FetchDiningHours downloads and parses the hours page for a date.
func FetchDiningHours(ctx context.Context, client *http.Client, date string) ([]VenueHours, error) {
	u := DiningBase + "/menu-hours/"
	if date != "" {
		u += "?date=" + date
	}
	body, err := get(ctx, client, u)
	if err != nil {
		return nil, err
	}
	defer body.Close()
	return ParseDiningHours(body)
}

// FetchDiningLocation downloads and parses one location page for a date.
func FetchDiningLocation(ctx context.Context, client *http.Client, slug, date string) (string, []MealMenu, error) {
	u := DiningBase + "/locations/" + slug + "/"
	if date != "" {
		u += "?date=" + date
	}
	body, err := get(ctx, client, u)
	if err != nil {
		return "", nil, err
	}
	defer body.Close()
	return ParseDiningLocation(body)
}

// --- small HTML helpers ---

func hasClass(n *html.Node, class string) bool {
	for _, c := range strings.Fields(attr(n, "class")) {
		if c == class {
			return true
		}
	}
	return false
}

func attr(n *html.Node, key string) string {
	for _, a := range n.Attr {
		if a.Key == key {
			return a.Val
		}
	}
	return ""
}

func text(n *html.Node) string {
	var b strings.Builder
	var walk func(*html.Node)
	walk = func(n *html.Node) {
		if n.Type == html.TextNode {
			b.WriteString(n.Data)
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			walk(c)
		}
	}
	walk(n)
	return strings.Join(strings.Fields(b.String()), " ")
}

// each visits every element under n.
func each(n *html.Node, fn func(*html.Node)) {
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		if c.Type == html.ElementNode {
			fn(c)
		}
		each(c, fn)
	}
}

func titleCase(s string) string {
	words := strings.Fields(s)
	for i, w := range words {
		if len(w) > 0 {
			words[i] = strings.ToUpper(w[:1]) + w[1:]
		}
	}
	return strings.Join(words, " ")
}

func get(ctx context.Context, client *http.Client, u string) (io.ReadCloser, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; dice-server; +https://github.com/dominicgodfrey/dice)")
	req.Header.Set("Accept", "text/html,application/json;q=0.9,*/*;q=0.8")
	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	if res.StatusCode != http.StatusOK {
		res.Body.Close()
		return nil, fmt.Errorf("scrape: %s returned %s", u, res.Status)
	}
	return res.Body, nil
}
