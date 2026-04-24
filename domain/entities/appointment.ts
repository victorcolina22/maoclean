import { GeoPoint, Timestamp } from 'firebase/firestore'

export type ServiceType =
  | 'sillas'
  | 'muebles'
  | 'alfombra'
  | 'apartamento'
  | 'casa'
  | 'carro'
  | 'otro'

export type AppointmentStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type PaymentStatus = 'pending' | 'paid' | 'partial'

export interface AppointmentLocation {
  address: string
  coordinates: GeoPoint
  commune: string
}

export interface Appointment {
  id: string
  userId: string
  clientId: string
  serviceType: ServiceType
  location: AppointmentLocation
  scheduledAt: Timestamp
  estimatedDuration: number
  price: number
  paymentStatus: PaymentStatus
  status: AppointmentStatus
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface CreateAppointmentDTO {
  userId: string
  clientId: string
  serviceType: ServiceType
  location: AppointmentLocation
  scheduledAt: Timestamp
  estimatedDuration: number
  price: number
  paymentStatus: PaymentStatus
  status: AppointmentStatus
  notes?: string
}

export interface UpdateAppointmentDTO {
  clientId?: string
  serviceType?: ServiceType
  location?: AppointmentLocation
  scheduledAt?: Timestamp
  estimatedDuration?: number
  price?: number
  paymentStatus?: PaymentStatus
  status?: AppointmentStatus
  notes?: string
}

export interface ProximitySuggestion {
  type: 'NEARBY' | 'OPTIMAL_ROUTE' | 'GROUP_BY_COMMUNE'
  message: string
  appointmentIds: string[]
  distanceKm: number
  estimatedTravelMin: number
  priority: 'high' | 'medium' | 'low'
}
