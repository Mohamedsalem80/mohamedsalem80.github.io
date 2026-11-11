# Metrom

Static Cairo Metro journey planner. Serve this directory over HTTP(S), or deploy
it to GitHub Pages; no build step or map API key is required.

## Map

Leaflet, the fallback grid, metro lines, station coordinates and station bounds
are hosted with the app. Street tiles load by default from
`https://tile.openstreetmap.org/{z}/{x}/{y}.png`, without an API key.
OpenStreetMap attribution remains visible on the map.

Use **Use local map** to disable street tiles, or **Show street map** to re-enable
them. Offline connections or three consecutive tile failures switch to the local
metro map; the status explains the failure and the button allows a retry.
Reconnecting retries street tiles unless you explicitly turned them off.
Opening the app as a `file:` URL uses only the local map; serve it over HTTP(S)
to load street tiles with the required browser referrer.
Zoom in for station labels or select a station for details.

Selected departure and destination stations appear immediately as green and red
pins. Planned transfers use amber pins; clicking a station or finding the nearest
station highlights it with a blue pin. Pin tips point to the station coordinates.
Resetting or changing the journey clears stale highlights.

Station-area circles are displayed at half their detection radius, and the
rectangular bounds at half their original width and height around the same center.
These are visual changes only: GPS station detection, arrival thresholds and
downloaded station bounds retain their original sizes.

The service worker stores local app assets for use after an initial visit, but
does not cache or prefetch external tiles. Standard browser HTTP caching honors
the provider's caching headers. Street tiles require connectivity and are not
guaranteed offline. Follow the [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/):
keep attribution and browser referrers enabled, and do not add bulk downloads or
offline tile prefetching. For heavy traffic, use a dedicated tile provider or
self-hosted tiles instead of the community service.

Location access requires HTTPS (or localhost) and permission.

Location-link import is separate from the map: full coordinate links are parsed
locally, while resolving short links or Plus Codes may require external services.

## Routes

Line 3 branches at Kit Kat. Line 2 connects to Line 3 at both Ataba and Cairo
University. The planner compares those interchanges by station count. For example:

Faisal → Cairo University → Boulak El Dakrour → Gamat El Dowal → Wadi El Nile

This journey changes to Line 3 at Cairo University, toward Adly Mansour.

## Languages

The overview and planner support English and Arabic. The header language button
switches the interface, station labels, route results, map details and GPS feedback.
Arabic uses right-to-left layout; coordinates and map geometry stay left-to-right.
The preference is stored locally and shared between the two public pages.
The separate GPS data recorder utility remains English-only.

The overview's artwork and shading follow the interface direction: artwork sits
opposite the desktop copy, with the darkest shading behind the text. Narrow
screens use vertical shading in both languages.

Translations are maintained in `js/metrom-i18n.js`: exact UI messages, station
names/aliases and templates for dynamic results. Translation changes only display
text and accessibility attributes, never station IDs, select values or route data.

## Tests

With Node.js installed, run from the repository root:

```powershell
node --test metrom\tests\*.test.js
```
