import { Coords } from "./types";

const R = 6371000; // earth radius in meters
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Great-circle distance in meters between two coordinates. */
export function distanceMeters(a: Coords, b: Coords): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Compass bearing (0–360, 0 = true north) from point a to point b. */
export function bearingDegrees(a: Coords, b: Coords): number {
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Smallest signed angle (-180..180) you'd turn from `heading` to face `target`.
 * Negative = target is to your left, positive = to your right.
 */
export function relativeAngle(heading: number, target: number): number {
  let diff = ((target - heading + 540) % 360) - 180;
  return diff;
}

export function formatPrice(value: number | null): string {
  if (value == null) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
}

/**
 * Just the street line of a formatted address, for the narrow AR tag —
 * "123 Maple St, Austin, TX 78701" becomes "123 Maple St". The full
 * address still shows in the detail sheet.
 */
export function shortAddress(address: string): string {
  const street = address.split(",")[0].trim();
  return street.length > 0 ? street : address;
}
