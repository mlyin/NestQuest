import { Coords, Property } from "../types";
import {
  fetchRentCastNearby,
  hasRentCastKey,
  RENTCAST_ENV_VAR,
} from "./rentcast";

/**
 * The source of house *discovery*. RentCast is the only API that takes raw
 * coordinates and returns owner names and last-sale records, which is what the
 * AR walk needs. Current-value estimates are a separate concern — see
 * services/estimates.ts, which fans out across RentCast and Zillow.
 */
export const DATA_SOURCE = {
  label: "RentCast",
  envVar: RENTCAST_ENV_VAR,
  hasKey: hasRentCastKey,
};

/**
 * Real property records near a coordinate.
 *
 * Failures propagate so the UI can say what went wrong. Nothing here
 * substitutes placeholder houses — every property shown comes from the API.
 */
export async function fetchNearby(center: Coords): Promise<Property[]> {
  return fetchRentCastNearby(center);
}

export { describeError, isProviderError } from "./errors";
export type { ProviderError, ProviderErrorCode } from "./errors";
export { fetchEstimates, configuredEstimateSources } from "./estimates";
export type { Estimate } from "./estimates";
