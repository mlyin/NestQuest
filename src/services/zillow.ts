import { providerError } from "./errors";

// Unofficial Zillow data via RapidAPI (host: zillow-com1). This scrapes Zillow,
// so it's ToS-gray and can break — fine for a personal build, not a public
// launch. Used only for the Zestimate on a house you tapped; house discovery
// is RentCast's job.
const HOST = "zillow-com1.p.rapidapi.com";
const API_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY ?? "";

export const ZILLOW_ENV_VAR = "EXPO_PUBLIC_RAPIDAPI_KEY";
export const hasZillowKey = () => API_KEY.length > 0;

interface ZillowPropertyResponse {
  zestimate?: number | null;
  rentZestimate?: number | null;
}

/**
 * Zillow's Zestimate for a single address.
 *
 * Returns null when Zillow has no estimate on file for the address — that is a
 * normal outcome, not an error. Genuine failures throw.
 */
export async function fetchZestimate(address: string): Promise<number | null> {
  if (!API_KEY) {
    throw providerError(
      "missing-key",
      "Zillow",
      `Add ${ZILLOW_ENV_VAR} to .env for Zestimates.`
    );
  }

  const url = `https://${HOST}/property?address=${encodeURIComponent(address)}`;
  const res = await fetch(url, {
    headers: { "X-RapidAPI-Key": API_KEY, "X-RapidAPI-Host": HOST },
  });

  if (!res.ok) {
    throw providerError(
      "request-failed",
      "Zillow",
      res.status === 401 || res.status === 403
        ? "RapidAPI rejected your key, or you're not subscribed to zillow-com1."
        : res.status === 404
        ? "Zillow has no record of this address."
        : res.status === 429
        ? "RapidAPI rate limit reached."
        : `Zillow request failed (HTTP ${res.status}).`
    );
  }

  const data = (await res.json()) as ZillowPropertyResponse | null;
  return typeof data?.zestimate === "number" ? data.zestimate : null;
}
