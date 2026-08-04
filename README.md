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
   **Explore** tab — you'll see floating price tags. It works with **Demo data**
   out of the box (no key needed).

> Your computer and iPhone must be on the **same Wi-Fi**. If they aren't, run
> `npx expo start --tunnel` instead.

## Getting real data (optional)

The app has a live **Demo / RentCast / Zillow** toggle at the top of the Explore
and Map screens. Demo always works. To enable the others, add keys:

1. Copy `.env.example` to `.env`.
2. Fill in either or both keys, then restart `npx expo start`.

### RentCast (best for the walk-around — every house, owner, last sale)
- Sign up: https://app.rentcast.io/app/api  (free tier available)
- Copy your key into `.env`:
  ```
  EXPO_PUBLIC_RENTCAST_API_KEY=your_key_here
  ```
- Returns property records within a radius: beds, baths, sqft, year built,
  last sale price/date, and **owner names** (public record).

### Zillow (unofficial, via RapidAPI — for-sale listings)
- Subscribe to the "Zillow.com" API by ApiMaker on RapidAPI:
  https://rapidapi.com/apimaker/api/zillow-com1
- Copy your RapidAPI key into `.env`:
  ```
  EXPO_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key_here
  ```
- ⚠️ This is a **third-party scraper of Zillow**, not an official API. It's
  ToS-gray and can break without notice. Fine for a personal build; do **not**
  ship it publicly. Returns for-sale listings (price, beds, baths); no owner data.

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
  geo.ts                 distance / bearing / heading math
  useDeviceLocation.ts   GPS + compass heading hook
  store.ts               app state (zustand): properties, saved, provider
  services/
    index.ts             provider dispatcher (demo/rentcast/zillow)
    rentcast.ts          RentCast API
    zillow.ts            Zillow via RapidAPI
    mock.ts              demo houses generator
  components/
    PropertyLabel.tsx    the floating AR price tag
    PropertyDetailSheet.tsx  bottom detail card
    ProviderToggle.tsx   Demo/RentCast/Zillow switch
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
