import { create } from "zustand";
import { Coords, Property } from "./types";
import { fetchByProvider, ProviderId } from "./services";

interface AppState {
  properties: Property[];
  saved: Property[];
  selected: Property | null;
  loading: boolean;
  provider: ProviderId;
  lastFetchCenter: Coords | null;

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
  provider: "demo",
  lastFetchCenter: null,

  select: (p) => set({ selected: p }),

  setProvider: (id) => {
    set({ provider: id, lastFetchCenter: null });
    const center = get().lastFetchCenter;
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
    set({ loading: true });
    try {
      const properties = await fetchByProvider(get().provider, center);
      set({ properties, lastFetchCenter: center });
    } finally {
      set({ loading: false });
    }
  },
}));
