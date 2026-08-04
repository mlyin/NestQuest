import * as Location from "expo-location";
import { Coords, Property } from "../types";
import { formatPrice } from "../geo";
import { providerError } from "./errors";

// Unofficial Zillow data via RapidAPI (host: zillow-com1). This scrapes Zillow,
// so it's ToS-gray and can break — fine for a personal build, not a public launch.
const HOST = "zillow-com1.p.rapidapi.com";
const API_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY ?? "";

export const ZILLOW_ENV_VAR = "EXPO_PUBLIC_RAPIDAPI_KEY";
export const hasZillowKey = () => API_KEY.length > 0;

interface ZillowProp {
  zpid?: number | string;
  address?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number;
  latitude?: number;
  longitude?: number;
  propertyType?: string;
  homeType?: string;
}

function normalize(p: ZillowProp): Property | null {
  if (p.latitude == null || p.longitude == null) return null;
  const price = p.price ?? null;
  return {
    id: String(p.zpid ?? `${p.latitude},${p.longitude}`),
    address: p.address ?? "Zillow listing",
    latitude: p.latitude,
    longitude: p.longitude,
    price,
    priceLabel: price != null ? `List ${formatPrice(price)}` : "Off-market",
    bedrooms: p.bedrooms ?? null,
    bathrooms: p.bathrooms ?? null,
    squareFootage: p.livingArea ?? null,
    yearBuilt: null, // not in search results; needs a per-listing detail call
    propertyType: p.propertyType ?? p.homeType ?? null,
    lastSalePrice: null,
    lastSaleDate: null,
    ownerNames: [], // Zillow does not expose owner names
  };
}

/**
 * Zillow for-sale listings near the user. The RapidAPI search takes a place
 * (zip/city), so we reverse-geocode the user's coordinates first.
 *
 * Everything returned is a real listing — an empty array means the search had
 * no for-sale houses in this area, never that we substituted placeholder data.
 */
export async function fetchZillowNearby(center: Coords): Promise<Property[]> {
  if (!API_KEY) {
    throw providerError(
      "missing-key",
      "Zillow",
      `Zillow needs a RapidAPI key. Add ${ZILLOW_ENV_VAR} to .env, then restart Expo.`
    );
  }

  const places = await Location.reverseGeocodeAsync(center);
  const place = places[0];
  const location =
    place?.postalCode ??
    (place?.city && place?.region ? `${place.city}, ${place.region}` : null);
  if (!location) {
    throw providerError(
      "geocode-failed",
      "Zillow",
      "Could not work out which area you're in, so Zillow can't be searched here."
    );
  }

  const url =
    `https://${HOST}/propertyExtendedSearch` +
    `?location=${encodeURIComponent(location)}&status_type=ForSale&home_type=Houses`;
  const res = await fetch(url, {
    headers: { "X-RapidAPI-Key": API_KEY, "X-RapidAPI-Host": HOST },
  });

  if (!res.ok) {
    throw providerError(
      "request-failed",
      "Zillow",
      res.status === 401 || res.status === 403
        ? "RapidAPI rejected your key. Check the value in .env and that you're subscribed to zillow-com1."
        : res.status === 429
        ? "RapidAPI rate limit reached. Wait a moment, then retry."
        : `Zillow (RapidAPI) request failed (HTTP ${res.status}).`
    );
  }

  const data = (await res.json()) as { props?: ZillowProp[] } | null;
  return (data?.props ?? [])
    .map(normalize)
    .filter((p): p is Property => p !== null);
}
