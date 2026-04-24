import { create } from 'zustand'
import { ProximitySuggestion } from '@/domain/entities/appointment'

interface ProximityState {
  suggestions: ProximitySuggestion[]
  setSuggestions: (suggestions: ProximitySuggestion[]) => void
  clear: () => void
}

export const useProximityStore = create<ProximityState>((set) => ({
  suggestions: [],
  setSuggestions: (suggestions) => set({ suggestions }),
  clear: () => set({ suggestions: [] }),
}))
