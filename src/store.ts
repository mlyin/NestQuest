import { create } from "zustand";
import { Coords, Property } from "./types";
import {
  defaultProvider,
  describeError,
  fetchByProvider,
  ProviderId,
} from "./services";

interface AppState {
  properties: Property[];
  saved: Property[];
  selected: Property | null;
  loading: boolean;
  provider: ProviderId;
  lastFetchCenter: Coords | null;
  /** Why the last fetch produced nothing, phrased for the user. */
  error: string | null;

  select: (p: Property | null) => void;
  setProvider: (id: ProviderId) => void;
  toggleSave: (p: Property) => void;
  isSaved: (id: string) => boolean;
  refresh: (center: Coords) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  properties: [],
  saved: [],
  selected: null,
  loading: false,
  provider: defaultProvider(),
  lastFetchCenter: null,
  error: null,

  select: (p) => set({ selected: p }),

  setProvider: (id) => {
    // Capture the centre before clearing it, so switching sources refetches
    // the spot you're standing on rather than waiting for you to walk 40m.
    const center = get().lastFetchCenter;
    set({ provider: id, properties: [], error: null, lastFetchCenter: null });
    if (center) get().refresh(center);
  },

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
      const properties = await fetchByProvider(get().provider, center);
      set({ properties, lastFetchCenter: center });
    } catch (e) {
      // Record the centre even on failure, otherwise every GPS tick retries
      // a call we already know fails. Switching source or moving 40m retries.
      set({ properties: [], lastFetchCenter: center, error: describeError(e) });
    } finally {
      set({ loading: false });
    }
  },
}));
