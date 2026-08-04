import { Coords, Property } from "../types";
import { formatPrice } from "../geo";
import { providerError } from "./errors";

const API_BASE = "https://api.rentcast.io/v1";
const API_KEY = process.env.EXPO_PUBLIC_RENTCAST_API_KEY ?? "";

export const RENTCAST_ENV_VAR = "EXPO_PUBLIC_RENTCAST_API_KEY";
export const hasRentCastKey = () => API_KEY.length > 0;

interface RentCastRecord {
  id?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  yearBuilt?: number;
  propertyType?: string;
  lastSalePrice?: number;
  lastSaleDate?: string;
  owner?: { names?: string[] };
}

function normalize(r: RentCastRecord, i: number): Property | null {
  if (r.latitude == null || r.longitude == null) return null;
  const price = r.lastSalePrice ?? null;
  return {
    id: r.id ?? `${r.latitude},${r.longitude},${i}`,
    address: r.formattedAddress ?? "Unknown address",
    latitude: r.latitude,
    longitude: r.longitude,
    price,
    priceLabel: price != null ? `Sold ${formatPrice(price)}` : "No price",
    bedrooms: r.bedrooms ?? null,
    bathrooms: r.bathrooms ?? null,
    squareFootage: r.squareFootage ?? null,
    yearBuilt: r.yearBuilt ?? null,
    propertyType: r.propertyType ?? null,
    lastSalePrice: r.lastSalePrice ?? null,
    lastSaleDate: r.lastSaleDate ?? null,
    ownerNames: r.owner?.names ?? [],
  };
}

/**
 * RentCast property records within a radius (miles). Great for the AR walk.
 * Everything returned is a real record — an empty array means the API had
 * nothing at these coordinates, never that we substituted placeholder data.
 */
export async function fetchRentCastNearby(
  center: Coords,
  radiusMiles = 0.2
): Promise<Property[]> {
  if (!API_KEY) {
    throw providerError(
      "missing-key",
      "RentCast",
      `RentCast needs an API key. Add ${RENTCAST_ENV_VAR} to .env, then restart Expo.`
    );
  }

  const url =
    `${API_BASE}/properties?latitude=${center.latitude}` +
    `&longitude=${center.longitude}&radius=${radiusMiles}&limit=50`;
  const res = await fetch(url, { headers: { "X-Api-Key": API_KEY } });

  if (!res.ok) {
    throw providerError(
      "request-failed",
      "RentCast",
      res.status === 401 || res.status === 403
        ? "RentCast rejected your API key. Check the value in .env."
        : res.status === 429
        ? "RentCast rate limit reached. Wait a moment, then retry."
        : `RentCast request failed (HTTP ${res.status}).`
    );
  }

  const data = (await res.json()) as RentCastRecord[] | null;
  if (!Array.isArray(data)) return [];
  return data.map(normalize).filter((p): p is Property => p !== null);
}
