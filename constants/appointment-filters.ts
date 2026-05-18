import type { Appointment } from '@/domain/entities/appointment'
import { isInCurrentWeek } from '@/utils/dateUtils'

export type FilterSlug =
  | 'pagos-pendientes'
  | 'esta-semana'
  | 'en-proceso'
  | 'completadas'

export interface AppointmentFilter {
  title: string
  predicate: (a: Appointment) => boolean
}

export const APPOINTMENT_FILTERS: Record<FilterSlug, AppointmentFilter> = {
  'pagos-pendientes': {
    title: 'Pagos pendientes',
    predicate: (a) =>
      a.paymentStatus === 'pending' || a.paymentStatus === 'partial',
  },
  'esta-semana': {
    title: 'Esta semana',
    predicate: (a) => isInCurrentWeek(a.scheduledAt),
  },
  'en-proceso': {
    title: 'En proceso',
    predicate: (a) => a.status === 'in_progress',
  },
  completadas: {
    title: 'Completadas',
    predicate: (a) => a.status === 'completed',
  },
}

export function isFilterSlug(s: string): s is FilterSlug {
  return s in APPOINTMENT_FILTERS
}
