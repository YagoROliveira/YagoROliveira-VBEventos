import { create } from "zustand";
import type { EventFilterValues } from "@/components/EventFilters";
type EventFiltersState = {
  filters: EventFilterValues;
  setFilters: (filters: EventFilterValues) => void;
  resetFilters: () => void;
};

const emptyFilters: EventFilterValues = { status: "", from: "", to: "" };

export const useEventFiltersStore = create<EventFiltersState>((set) => ({
  filters: emptyFilters,
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: emptyFilters }),
}));
