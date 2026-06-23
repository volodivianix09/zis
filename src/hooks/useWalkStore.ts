import { create } from 'zustand'
import type { Walk, GeoPoint } from '@/types'

interface WalkState {
  walks: Walk[]
  activeWalk: Walk | null
  userLocation: GeoPoint | null
  selectedWalk: Walk | null
  setWalks: (walks: Walk[]) => void
  addWalk: (walk: Walk) => void
  updateWalk: (id: string, updates: Partial<Walk>) => void
  removeWalk: (id: string) => void
  setActiveWalk: (walk: Walk | null) => void
  setUserLocation: (location: GeoPoint | null) => void
  setSelectedWalk: (walk: Walk | null) => void
}

export const useWalkStore = create<WalkState>((set) => ({
  walks: [],
  activeWalk: null,
  userLocation: null,
  selectedWalk: null,
  setWalks: (walks) => set({ walks }),
  addWalk: (walk) => set((state) => ({ walks: [...state.walks, walk] })),
  updateWalk: (id, updates) =>
    set((state) => ({
      walks: state.walks.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    })),
  removeWalk: (id) =>
    set((state) => ({ walks: state.walks.filter((w) => w.id !== id) })),
  setActiveWalk: (activeWalk) => set({ activeWalk }),
  setUserLocation: (userLocation) => set({ userLocation }),
  setSelectedWalk: (selectedWalk) => set({ selectedWalk }),
}))
