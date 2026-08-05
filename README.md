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

## You need a RentCast API key (required)

**Every house shown is real API data.** There is no demo or sample mode — if the
key is missing or a request fails, the screen says so rather than filling in
placeholder houses.

1. Sign up at https://www.rentcast.io/api
2. Create a key in the dashboard: https://app.rentcast.io/app/api
3. Copy `.env.example` to `.env` and paste it in:
   ```
   EXPO_PUBLIC_RENTCAST_API_KEY=your_key_here
   ```
4. Restart with `npx expo start --clear`. Keys are read at build time, so a
   server that's already running will not pick up your edits.

RentCast returns property records within a radius: beds, baths, sqft, year
built, last sale price/date, and **owner names** from public county records.

> ⚠️ Anything prefixed `EXPO_PUBLIC_` is embedded in the JS bundle and readable
> by anyone who installs the app. Fine for a personal build — don't ship this
> key in a public release.

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

### Why RentCast, and not Zillow

**Zillow and Redfin have no public property API.** The earlier build used an
unofficial Zillow scraper on RapidAPI, which returned for-sale listings only —
no owner names, no year built, no last-sale history — and was ToS-gray besides.
It has been removed.

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
  config.ts              MOVE_THRESHOLD_M — how often we spend an API request
  geo.ts                 distance / bearing / heading math
  useDeviceLocation.ts   GPS + compass heading hook
  store.ts               app state (zustand): properties, saved, error
  services/
    index.ts             the data source (RentCast) + re-exports
    errors.ts            typed failures, phrased for the UI
    rentcast.ts          RentCast API
  components/
    PropertyLabel.tsx    floating AR tag: price + address + beds/baths
    PropertyDetailSheet.tsx  bottom detail card
    DataStatus.tsx       explains an empty screen (no key / failed / none found)
```

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
