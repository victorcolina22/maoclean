import type { Timestamp } from 'firebase/firestore'
import type { Appointment } from '@/domain/entities/appointment'

export interface DerivedClient {
  clientName: string
  clientPhone?: string
  totalSpent: number
  pendingBalance: number
  appointmentCount: number
  lastVisitAt: Timestamp
  appointments: Appointment[]
}

export type ClientSort = 'name' | 'spent' | 'recent'

const EXCLUDED = new Set(['cancelled', 'no_show'])

export function deriveClients(appointments: Appointment[]): DerivedClient[] {
  const acc = new Map<string, DerivedClient>()

  for (const appt of appointments) {
    const name = appt.clientName

    if (!acc.has(name)) {
      acc.set(name, {
        clientName: name,
        clientPhone: undefined,
        totalSpent: 0,
        pendingBalance: 0,
        appointmentCount: 0,
        lastVisitAt: appt.scheduledAt,
        appointments: [],
      })
    }

    const entry = acc.get(name)!

    entry.appointments.push(appt)

    // First real phone wins
    if (!entry.clientPhone && appt.clientPhone?.trim()) {
      entry.clientPhone = appt.clientPhone.trim()
    }

    // Track max scheduledAt for lastVisitAt
    if (appt.scheduledAt.toMillis() > entry.lastVisitAt.toMillis()) {
      entry.lastVisitAt = appt.scheduledAt
    }

    // Excluded statuses don't count toward spent/count/balance
    if (EXCLUDED.has(appt.status)) {
      continue
    }

    entry.totalSpent += appt.amountPaid ?? 0
    entry.appointmentCount++

    if (appt.paymentStatus === 'pending' || appt.paymentStatus === 'partial') {
      entry.pendingBalance += Math.max(0, (appt.price ?? 0) - (appt.amountPaid ?? 0))
    }
  }

  return Array.from(acc.values())
}

export function filterClients(clients: DerivedClient[], query: string): DerivedClient[] {
  const q = query.trim()
  if (!q) return clients

  const qLower = q.toLowerCase()
  const qDigits = q.replace(/\D/g, '')

  return clients.filter((c) => {
    if (c.clientName.toLowerCase().includes(qLower)) return true
    if (qDigits && (c.clientPhone ?? '').replace(/\D/g, '').includes(qDigits)) return true
    return false
  })
}

export function sortClients(clients: DerivedClient[], sort: ClientSort): DerivedClient[] {
  const copy = [...clients]

  switch (sort) {
    case 'name':
      return copy.sort((a, b) =>
        a.clientName.localeCompare(b.clientName, 'es', { sensitivity: 'base' })
      )
    case 'spent':
      return copy.sort(
        (a, b) =>
          b.totalSpent - a.totalSpent ||
          a.clientName.localeCompare(b.clientName, 'es')
      )
    case 'recent':
      return copy.sort(
        (a, b) =>
          b.lastVisitAt.toMillis() - a.lastVisitAt.toMillis() ||
          a.clientName.localeCompare(b.clientName, 'es')
      )
  }
}
