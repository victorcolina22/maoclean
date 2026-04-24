import { create } from 'zustand'
import { Client } from '@/domain/entities/client'

interface ClientsState {
  clients: Client[]
  isLoading: boolean
  error: string | null
  setClients: (clients: Client[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addOrUpdate: (client: Client) => void
  remove: (id: string) => void
}

export const useClientsStore = create<ClientsState>((set) => ({
  clients: [],
  isLoading: false,
  error: null,
  setClients: (clients) => set({ clients, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addOrUpdate: (client) =>
    set((state) => {
      const exists = state.clients.some((c) => c.id === client.id)
      if (exists) {
        return {
          clients: state.clients.map((c) => (c.id === client.id ? client : c)),
        }
      }
      return { clients: [...state.clients, client] }
    }),
  remove: (id) =>
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id),
    })),
}))
