# PriceWalk

Walk a neighborhood, point your iPhone at a house, and see its price, beds/baths,
year built, last sale, and (where public) the owner floating over it in AR — plus a
map view. Built with **Expo + React Native (TypeScript)**. Runs on a real iPhone
with **no Apple Developer account** via the free **Expo Go** app.

> Working title "PriceWalk" — change it in one line in `app.json` (`expo.name`).

## Run it on your iPhone (5 minutes, no Apple account)

1. Install dependencies (in this folder):
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npx expo start
   ```
3. On your iPhone, install **Expo Go** from the App Store.
4. Open the iPhone **Camera** app and scan the QR code shown in your terminal.
   It opens in Expo Go and loads the app. Save a file → it reloads instantly.
5. Allow **Camera** and **Location** when prompted. Go outside and open the
   **Explore** tab — you'll see a floating tag over each house with its price,
   street address, and beds/baths.

> Your computer and iPhone must be on the **same Wi-Fi**. If they aren't, run
> `npx expo start --tunnel` instead.

## API keys

**Every house shown is real API data.** There is no demo or sample mode — if a
key is missing or a request fails, the screen says so rather than filling in
placeholder houses.

### RentCast — required

Finds the houses around you, and supplies beds, baths, sqft, year built, last
sale price/date, and **owner names** from public county records.

1. Sign up at https://www.rentcast.io/api
2. Create a key in the dashboard: https://app.rentcast.io/app/api
3. Copy `.env.example` to `.env` and paste it in:
   ```
   EXPO_PUBLIC_RENTCAST_API_KEY=your_key_here
   ```
4. Restart with `npx expo start --clear`. Keys are read at build time, so a
   server that's already running will not pick up your edits.

### Zillow via RapidAPI — optional

Adds Zillow's **Zestimate** next to RentCast's estimate when you tap a house.
It is *not* used to find houses. Leave it blank to skip Zestimates.

- Subscribe to zillow-com1: https://rapidapi.com/apimaker/api/zillow-com1
- ```
  EXPO_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key_here
  ```
- ⚠️ Third-party scraper of Zillow, not an official API. ToS-gray and can break
  without notice. Fine for a personal build; don't ship it publicly.

> ⚠️ Anything prefixed `EXPO_PUBLIC_` is embedded in the JS bundle and readable
> by anyone who installs the app. Fine for a personal build — don't ship these
> keys in a public release.

## Current market value

Tapping a house opens the detail sheet, which asks **every configured source in
parallel** for a present-day value estimate and shows one row each:

| Source | Returns | Key |
| --- | --- | --- |
| RentCast | Value estimate + high/low range | `EXPO_PUBLIC_RENTCAST_API_KEY` |
| Zillow | Zestimate | `EXPO_PUBLIC_RAPIDAPI_KEY` |

Sources are independent — a broken RapidAPI key still leaves RentCast's number
on screen, and the failing row shows the actual HTTP error rather than going
blank. Add a source by appending to `SOURCES` in `src/services/estimates.ts`.

Note the distinction on screen: the big number on the AR tag is the **last sale
price** (it comes free with the house search). The **current estimate** is a
separate billed request per house, which is why it only runs on tap.

There is no third self-serve option today. ATTOM and Estated are trial or
contract gated (Estated is migrating onto ATTOM's infrastructure) and
HouseCanary is enterprise-only, so none of them can be wired up with a key you
sign up for in five minutes.

### Watch your request quota

The free **Developer** plan includes **50 requests/month**, and the app refetches
every time you move `MOVE_THRESHOLD_M` metres (`src/config.ts`, default 40).
That's about **2 km of walking per month**. Paid tiers start at $74/mo for
1,000 requests.

To stretch the free tier, raise `MOVE_THRESHOLD_M`. The search radius is already
0.2 miles (~320m), so refetching every 40m mostly re-requests the same houses:

| `MOVE_THRESHOLD_M` | Walking distance per 50 requests |
| --- | --- |
| 40m | 2 km |
| 150m | 7.5 km |
| 250m | 12.5 km |

### Why RentCast finds the houses

**Zillow and Redfin have no public property API.** RentCast is the only source
that takes raw coordinates and returns owner names and last-sale records, which
is exactly what walking down a street needs. The Zillow scraper can only search
by place name (ZIP or city) and carries no owner data, so it earns a place only
as a second opinion on value.

Alternatives worth knowing about if you outgrow RentCast:

| Provider | Owner data | Notes |
| --- | --- | --- |
| **RentCast** | Yes | ~140M properties, coordinate search, free tier. What this app uses. |
| **ATTOM** | Yes | ~158M properties, 9,000 fields. Free trial, then enterprise contracts. |
| **Estated** | Yes | Deeds, tax, ownership history. Migrating onto ATTOM's infrastructure. |
| **Regrid** | Yes | Parcel *polygons* + ownership. The upgrade path for pinning exact houses. |
| **RealEstateAPI** | Yes | Aggregated public records, developer-focused. |

Regrid is the interesting one long-term — parcel boundaries are what you'd need
to fix the "adjacent house mislabeled" problem described below.

## Project layout

```
app/                     screens (expo-router, file-based)
  _layout.tsx            root stack
  (tabs)/_layout.tsx     tab bar: Explore / Map / Saved
  (tabs)/index.tsx       AR camera view with floating price tags
  (tabs)/map.tsx         Apple Maps with price pins
  (tabs)/saved.tsx       saved houses
src/
  types.ts               Property model
  config.ts              AR + quota dials: MOVE_THRESHOLD_M, MAX_DISTANCE_M, HFOV_DEG
  geo.ts                 distance / bearing / heading math
  useDeviceLocation.ts   GPS + compass heading hook
  store.ts               app state (zustand): properties, saved, estimates, error
  services/
    index.ts             house discovery (RentCast) + re-exports
    errors.ts            typed failures, phrased for the UI
    rentcast.ts          RentCast: nearby search + value estimate (AVM)
    zillow.ts            Zillow via RapidAPI: Zestimate only
    estimates.ts         fans out across every configured value source
  components/
    PropertyLabel.tsx    floating AR tag: price + address + beds/baths
    PropertyDetailSheet.tsx  detail card: estimates, details, owner
    DataStatus.tsx       explains an empty screen (no key / failed / none found)
```

## Nothing showing in the AR view?

The HUD at the top of Explore reports what the two draw filters did, so an
empty camera view is diagnosable rather than mysterious:

```
3 in view · 15 nearby · 87°
```

- **`15 nearby` but `0 in view`** — the houses loaded fine, they're just not in
  front of you. A house is drawn only when its bearing is within ±`HFOV_DEG`/2
  (~27.5°) of your heading. That's a 55° window out of 360°, so most houses are
  behind you at any moment. The HUD says *"Turn around — N houses out of frame."*
- **"No compass reading"** — `watchHeadingAsync` never fired, so every bearing is
  computed as though you face north. Tags will be in the wrong place. Calibrate
  by waving the phone in a figure-8, and note the iOS Simulator has no compass.
- **"N beyond 320m"** — houses were returned but sit outside `MAX_DISTANCE_M`.
  Raise it in `src/config.ts` (the search radius is ~322m, so above that the
  cap is pointless).
- **`0 nearby`** — no houses came back at all. The card in the middle of the
  screen says why: missing key, rejected key, rate limit, or genuinely nothing
  at these coordinates.

Both Explore and Map have a **Refresh** button so you can force a fetch without
walking `MOVE_THRESHOLD_M`. Map also has **Recenter**, since the map only
auto-centres on mount.

GPS is ~5–10m accurate and the compass drifts, so tags land on the right side of
the street more reliably than on the exact right house — see the AR limits below.

## How the AR works (and its limits)

Expo Go can't run true ARKit world-tracking, so this uses a **location + compass
HUD**: it computes the compass bearing from you to each house and, when a house
falls inside the camera's field of view, draws its price tag at that angle. Good
enough to "point and see prices." Because phone GPS (~5–10m) and compass are noisy,
adjacent houses can be mislabeled. The upgrade path is **ARKit geo-anchors** +
**parcel polygons** to pin the exact house — that requires a custom native build
(and Apple signing), which is a later milestone.

## Notes / later milestones

- **Zillow/Redfin have no official public property API.** RentCast is the clean
  path; the Zillow option here is an unofficial RapidAPI scraper.
- Owner names come from public county records (via RentCast). Consider making
  owner display opt-in for privacy.
- To ship to friends beyond Expo Go, or to use true ARKit, you'll need an Apple
  Developer account ($99/yr) and `eas build` + TestFlight.
