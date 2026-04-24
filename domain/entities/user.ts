import { Timestamp } from 'firebase/firestore'

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
