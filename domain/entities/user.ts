import { Timestamp } from 'firebase/firestore'

// The authoritative role/ownerId live in the account's Firebase Auth Custom
// Claims (signed, tamper-proof, read directly from the ID token) — see
// stores/useRoleStore.ts. Mirrored here only for display purposes.
export type Role = 'admin' | 'viewer'

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role?: Role
  ownerId?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
