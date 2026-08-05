import { create } from "zustand";
import { Coords, Property } from "./types";
import { describeError, fetchNearby } from "./services";

interface AppState {
  properties: Property[];
  saved: Property[];
  selected: Property | null;
  loading: boolean;
  lastFetchCenter: Coords | null;
  /** Why the last fetch produced nothing, phrased for the user. */
  error: string | null;

  select: (p: Property | null) => void;
  toggleSave: (p: Property) => void;
  isSaved: (id: string) => boolean;
  refresh: (center: Coords) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  properties: [],
  saved: [],
  selected: null,
  loading: false,
  lastFetchCenter: null,
  error: null,

  select: (p) => set({ selected: p }),

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
      // a call we already know fails. Retry is manual, or after moving 40m.
      set({ properties: [], lastFetchCenter: center, error: describeError(e) });
    } finally {
      set({ loading: false });
    }
  },
}));
