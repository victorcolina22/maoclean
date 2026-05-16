import { GeoPoint, Timestamp } from 'firebase/firestore'

export type DeliveryStatus = 'ok' | 'soon' | 'late'

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

export interface PaymentEntry {
  amount: number
  paidAt: Timestamp
  note?: string
}

export interface Appointment {
  id: string
  userId: string
  clientName: string
  clientPhone?: string
  serviceType: ServiceType
  location: AppointmentLocation
  scheduledAt: Timestamp
  amountPaid: number
  paymentHistory: PaymentEntry[]
  deliveryDate?: Timestamp
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
  clientName: string
  clientPhone?: string
  serviceType: ServiceType
  location: AppointmentLocation
  scheduledAt: Timestamp
  amountPaid: number
  paymentHistory: PaymentEntry[]
  deliveryDate?: Timestamp
  estimatedDuration: number
  price: number
  paymentStatus: PaymentStatus
  status: AppointmentStatus
  notes?: string
}

export interface UpdateAppointmentDTO {
  clientName?: string
  clientPhone?: string
  serviceType?: ServiceType
  location?: AppointmentLocation
  scheduledAt?: Timestamp
  deliveryDate?: Timestamp
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
