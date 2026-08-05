import { Coords, Property } from "../types";
import {
  fetchRentCastNearby,
  hasRentCastKey,
  RENTCAST_ENV_VAR,
} from "./rentcast";

/**
 * The single source of house data. RentCast is the only provider that returns
 * owner names and last-sale records for arbitrary coordinates, which is what
 * the AR walk needs — see README for the alternatives that were considered.
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
