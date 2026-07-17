import { create } from 'zustand'
import { Role } from '@/domain/entities/user'

interface RoleState {
  role: Role | null
  ownerId: string | null
  isLoading: boolean
  setClaims: (claims: { role?: Role; ownerId?: string }) => void
  setLoading: (loading: boolean) => void
  clear: () => void
}

export const useRoleStore = create<RoleState>((set) => ({
  role: null,
  ownerId: null,
  // True until the ID token has been read at least once after login — the
  // gates in task #8 must not treat "not loaded yet" as "viewer".
  isLoading: true,
  setClaims: (claims) =>
    set({
      role: claims.role ?? null,
      ownerId: claims.ownerId ?? null,
      isLoading: false,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ role: null, ownerId: null, isLoading: true }),
}))

export function useIsAdmin(): boolean {
  return useRoleStore((s) => s.role === 'admin')
}
