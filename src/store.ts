import { create } from "zustand";
import { Coords, Property } from "./types";
import { describeError, Estimate, fetchEstimates, fetchNearby } from "./services";

interface AppState {
  properties: Property[];
  saved: Property[];
  selected: Property | null;
  loading: boolean;
  lastFetchCenter: Coords | null;
  /** Why the last fetch produced nothing, phrased for the user. */
  error: string | null;

  /** Current-value estimates for `selected`, one row per configured source. */
  estimates: Estimate[];
  estimatesLoading: boolean;

  select: (p: Property | null) => void;
  toggleSave: (p: Property) => void;
  isSaved: (id: string) => boolean;
  refresh: (center: Coords) => Promise<void>;
  loadEstimates: (p: Property) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  properties: [],
  saved: [],
  selected: null,
  loading: false,
  lastFetchCenter: null,
  error: null,
  estimates: [],
  estimatesLoading: false,

  // Clearing estimates on select stops a previously-tapped house's numbers
  // from flashing up under the next one's address.
  select: (p) => set({ selected: p, estimates: [] }),

  toggleSave: (p) =>
    set((s) => {
      const exists = s.saved.some((x) => x.id === p.id);
      return {
        saved: exists ? s.saved.filter((x) => x.id !== p.id) : [...s.saved, p],
      };
    }),

  isSaved: (id) => get().saved.some((x) => x.id === id),

  refresh: async (center) => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const properties = await fetchNearby(center);
      set({ properties, lastFetchCenter: center });
    } catch (e) {
      // Record the centre even on failure, otherwise every GPS tick retries
      // a call we already know fails. Retry is manual, or after moving on.
      set({ properties: [], lastFetchCenter: center, error: describeError(e) });
    } finally {
      set({ loading: false });
    }
  },

  loadEstimates: async (p) => {
    if (get().estimatesLoading) return;
    set({ estimatesLoading: true });
    try {
      const estimates = await fetchEstimates(p);
      // Ignore results that arrived after you tapped a different house.
      if (get().selected?.id === p.id) set({ estimates });
    } finally {
      set({ estimatesLoading: false });
    }
  },
}));
