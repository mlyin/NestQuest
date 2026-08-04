import * as Location from "expo-location";
import { Coords, Property } from "../types";
import { formatPrice } from "../geo";
import { generateMockProperties } from "./mock";

// Unofficial Zillow data via RapidAPI (host: zillow-com1). This scrapes Zillow,
// so it's ToS-gray and can break — fine for a personal build, not a public launch.
const HOST = "zillow-com1.p.rapidapi.com";
const API_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY ?? "";

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
 */
export async function fetchZillowNearby(center: Coords): Promise<Property[]> {
  if (!API_KEY) return generateMockProperties(center);

  const places = await Location.reverseGeocodeAsync(center);
  const place = places[0];
  const location =
    place?.postalCode ??
    (place?.city && place?.region ? `${place.city}, ${place.region}` : null);
  if (!location) throw new Error("Could not resolve your area for Zillow.");

  const url =
    `https://${HOST}/propertyExtendedSearch` +
    `?location=${encodeURIComponent(location)}&status_type=ForSale&home_type=Houses`;
  const res = await fetch(url, {
    headers: { "X-RapidAPI-Key": API_KEY, "X-RapidAPI-Host": HOST },
  });
  if (!res.ok) throw new Error(`Zillow(RapidAPI) ${res.status}`);
  const data: { props?: ZillowProp[] } = await res.json();
  const list = (data.props ?? [])
    .map(normalize)
    .filter((p): p is Property => p !== null);
  return list.length ? list : generateMockProperties(center);
}
