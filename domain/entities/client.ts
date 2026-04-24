import { Timestamp } from 'firebase/firestore'

export interface Client {
  id: string
  userId: string
  name: string
  phone: string
  email?: string
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface CreateClientDTO {
  userId: string
  name: string
  phone: string
  email?: string
  notes?: string
}

export interface UpdateClientDTO {
  name?: string
  phone?: string
  email?: string
  notes?: string
}
