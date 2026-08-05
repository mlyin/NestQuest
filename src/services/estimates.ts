import { Property } from "../types";
import { describeError } from "./errors";
import { fetchRentCastValue, hasRentCastKey } from "./rentcast";
import { fetchZestimate, hasZillowKey } from "./zillow";

/**
 * One source's answer to "what is this house worth today".
 *
 * Every configured source produces a row, including failed ones — a visible
 * error beats a silently missing number when you're trying to work out
 * whether a key is wrong.
 */
export interface Estimate {
  source: string;
  value: number | null;
  low: number | null;
  high: number | null;
  error: string | null;
}

interface EstimateSource {
  label: string;
  isConfigured: () => boolean;
  fetch: (p: Property) => Promise<Omit<Estimate, "source" | "error">>;
}

/**
 * Add a source here and it shows up in the detail sheet automatically.
 *
 * There is no third self-serve option today: ATTOM and Estated are trial or
 * contract gated (Estated is migrating onto ATTOM's infrastructure), and
 * HouseCanary is enterprise-only. See README.
 */
const SOURCES: EstimateSource[] = [
  {
    label: "RentCast",
    isConfigured: hasRentCastKey,
    fetch: async (p) => fetchRentCastValue(p.address),
  },
  {
    label: "Zillow",
    isConfigured: hasZillowKey,
    fetch: async (p) => ({
      value: await fetchZestimate(p.address),
      low: null,
      high: null,
    }),
  },
];

/** Which sources have a key, for rendering placeholders before results land. */
export function configuredEstimateSources(): string[] {
  return SOURCES.filter((s) => s.isConfigured()).map((s) => s.label);
}

/**
 * Ask every configured source in parallel. One source failing never hides
 * another's answer, so a broken RapidAPI key still leaves RentCast's number
 * on screen.
 *
 * Each call is separately billed by its provider — this runs on tap, never
 * for a whole screen of houses.
 */
export async function fetchEstimates(p: Property): Promise<Estimate[]> {
  const active = SOURCES.filter((s) => s.isConfigured());

  const settled = await Promise.allSettled(active.map((s) => s.fetch(p)));

  return settled.map((result, i) => {
    const source = active[i].label;
    if (result.status === "fulfilled") {
      return { source, ...result.value, error: null };
    }
    return {
      source,
      value: null,
      low: null,
      high: null,
      error: describeError(result.reason),
    };
  });
}
