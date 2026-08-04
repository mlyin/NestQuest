import { Coords, Property } from "../types";
import {
  fetchRentCastNearby,
  hasRentCastKey,
  RENTCAST_ENV_VAR,
} from "./rentcast";
import { fetchZillowNearby, hasZillowKey, ZILLOW_ENV_VAR } from "./zillow";

export type ProviderId = "rentcast" | "zillow";

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  /** The .env variable that unlocks this provider, shown in the UI when absent. */
  envVar: string;
  hasKey: () => boolean;
}

export const PROVIDERS: ProviderMeta[] = [
  {
    id: "rentcast",
    label: "RentCast",
    envVar: RENTCAST_ENV_VAR,
    hasKey: hasRentCastKey,
  },
  {
    id: "zillow",
    label: "Zillow",
    envVar: ZILLOW_ENV_VAR,
    hasKey: hasZillowKey,
  },
];

export function providerMeta(id: ProviderId): ProviderMeta {
  const meta = PROVIDERS.find((p) => p.id === id);
  if (!meta) throw new Error(`Unknown provider: ${id}`);
  return meta;
}

/** Whichever real source has a key, so a configured app starts on live data. */
export function defaultProvider(): ProviderId {
  return (PROVIDERS.find((p) => p.hasKey()) ?? PROVIDERS[0]).id;
}

/**
 * Fetch nearby properties from the chosen source.
 *
 * Failures propagate so the UI can say what went wrong. Nothing here
 * substitutes placeholder houses — every property shown comes from the API.
 */
export async function fetchByProvider(
  id: ProviderId,
  center: Coords
): Promise<Property[]> {
  if (id === "zillow") return fetchZillowNearby(center);
  return fetchRentCastNearby(center);
}

export { describeError, isProviderError } from "./errors";
export type { ProviderError, ProviderErrorCode } from "./errors";
