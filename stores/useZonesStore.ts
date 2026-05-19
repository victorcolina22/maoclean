import { create } from 'zustand'
import { Zone } from '@/domain/entities/zone'
import { zonesRepository } from '@/services/zonesRepository'

interface ZonesState {
  zones: Zone[]
  isLoading: boolean
  error: string | null
  load: (uid: string) => Promise<void>
  createZone: (uid: string, zone: Zone) => Promise<void>
  updateZone: (uid: string, zone: Zone) => Promise<void>
  deleteZone: (uid: string, id: string) => Promise<void>
}

function stripCommunesFromOthers(zones: Zone[], communes: string[], keepId: string): Zone[] {
  const taken = new Set(communes.map((c) => c.trim().toLowerCase()))
  return zones.map((z) =>
    z.id === keepId
      ? z
      : { ...z, communes: z.communes.filter((c) => !taken.has(c.trim().toLowerCase())) }
  )
}

export const useZonesStore = create<ZonesState>((set, get) => ({
  zones: [],
  isLoading: false,
  error: null,

  load: async (uid) => {
    set({ isLoading: true, error: null })
    const result = await zonesRepository.getZones(uid)
    if (result.success) {
      set({ zones: result.data, isLoading: false })
    } else {
      set({ error: result.error, isLoading: false })
    }
  },

  createZone: async (uid, zone) => {
    const prev = get().zones
    const stripped = stripCommunesFromOthers([...prev, zone], zone.communes, zone.id)
    set({ zones: stripped })
    const result = await zonesRepository.saveZones(uid, stripped)
    if (!result.success) {
      set({ zones: prev, error: result.error })
    }
  },

  updateZone: async (uid, zone) => {
    const prev = get().zones
    const replaced = prev.map((z) => (z.id === zone.id ? zone : z))
    const stripped = stripCommunesFromOthers(replaced, zone.communes, zone.id)
    set({ zones: stripped })
    const result = await zonesRepository.saveZones(uid, stripped)
    if (!result.success) {
      set({ zones: prev, error: result.error })
    }
  },

  deleteZone: async (uid, id) => {
    const prev = get().zones
    const next = prev.filter((z) => z.id !== id)
    set({ zones: next })
    const result = await zonesRepository.saveZones(uid, next)
    if (!result.success) {
      set({ zones: prev, error: result.error })
    }
  },
}))
