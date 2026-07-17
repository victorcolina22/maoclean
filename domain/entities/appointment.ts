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

export interface ServiceItem {
  type: ServiceType
  label: string
  qty: number
  // Absent when the reader (viewer role) has no access to pricing data —
  // see services/pricingRepository.ts. Present for admin reads.
  unitPrice?: number
}

export interface Appointment {
  id: string
  ownerId: string
  userId: string
  clientName: string
  clientPhone?: string
  items: ServiceItem[]
  location: AppointmentLocation
  scheduledAt: Timestamp
  // The fields below live in a separate admin-only Firestore document
  // (orgs/{ownerId}/private/pricing) and are merged in by the repository
  // ONLY when the reader can access it. They're genuinely absent (not just
  // hidden in the UI) for a viewer-role reader — Firestore's security rules
  // deny that read outright.
  amountPaid?: number
  paymentHistory?: PaymentEntry[]
  // Computed: sum of items[].qty * items[].unitPrice. Not stored in Firestore.
  price?: number
  paymentStatus?: PaymentStatus
  deliveryDate?: Timestamp
  estimatedDuration: number
  status: AppointmentStatus
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface CreateAppointmentDTO {
  ownerId: string
  userId: string
  clientName: string
  clientPhone?: string
  items: ServiceItem[]
  location: AppointmentLocation
  scheduledAt: Timestamp
  amountPaid: number
  paymentHistory: PaymentEntry[]
  deliveryDate?: Timestamp
  estimatedDuration: number
  paymentStatus: PaymentStatus
  status: AppointmentStatus
  notes?: string
}

export interface UpdateAppointmentDTO {
  clientName?: string
  clientPhone?: string
  items?: ServiceItem[]
  location?: AppointmentLocation
  scheduledAt?: Timestamp
  deliveryDate?: Timestamp
  estimatedDuration?: number
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
