import { Coords, Property } from "../types";
import { generateMockProperties } from "./mock";
import { fetchRentCastNearby, hasRentCastKey } from "./rentcast";
import { fetchZillowNearby, hasZillowKey } from "./zillow";

export type ProviderId = "demo" | "rentcast" | "zillow";

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  hasKey: () => boolean;
}

export const PROVIDERS: ProviderMeta[] = [
  { id: "demo", label: "Demo", hasKey: () => true },
  { id: "rentcast", label: "RentCast", hasKey: hasRentCastKey },
  { id: "zillow", label: "Zillow", hasKey: hasZillowKey },
];

/** Fetch nearby properties from the chosen source, always returning something. */
export async function fetchByProvider(
  id: ProviderId,
  center: Coords
): Promise<Property[]> {
  try {
    if (id === "rentcast") return await fetchRentCastNearby(center);
    if (id === "zillow") return await fetchZillowNearby(center);
    return generateMockProperties(center);
  } catch (e) {
    console.warn(`${id} fetch failed, using demo data:`, e);
    return generateMockProperties(center);
  }
}
