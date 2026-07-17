import { deriveClients, filterClients, sortClients } from './clientUtils'
import type { Appointment, AppointmentStatus, PaymentStatus, ServiceItem } from '@/domain/entities/appointment'
import type { Timestamp } from 'firebase/firestore'

// ── Firestore Timestamp mock ──────────────────────────────────────────────────
function makeTimestamp(date: Date): Timestamp {
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    isEqual: () => false,
    valueOf: () => '',
  } as unknown as Timestamp
}

// ── Appointment factory ───────────────────────────────────────────────────────
const DEFAULT_DATE = new Date('2026-01-15T10:00:00Z')

let _apptId = 0
function makeAppt(overrides: Partial<Appointment> = {}): Appointment {
  _apptId++
  return {
    id: `appt-${_apptId}`,
    ownerId: 'user-1',
    userId: 'user-1',
    clientName: 'Cliente Default',
    clientPhone: '+56912345678',
    items: [] as ServiceItem[],
    location: { address: 'Calle 123', coordinates: { latitude: 0, longitude: 0 } as any, commune: 'Las Condes' },
    scheduledAt: makeTimestamp(DEFAULT_DATE),
    amountPaid: 0,
    paymentHistory: [],
    estimatedDuration: 60,
    price: 0,
    paymentStatus: 'paid' as PaymentStatus,
    status: 'completed' as AppointmentStatus,
    notes: '',
    createdAt: makeTimestamp(DEFAULT_DATE),
    updatedAt: makeTimestamp(DEFAULT_DATE),
    ...overrides,
  }
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('deriveClients', () => {
  test('1. empty array returns empty array', () => {
    expect(deriveClients([])).toEqual([])
  })

  test('2. single completed appt creates one client with correct fields', () => {
    const date = new Date('2026-03-01T10:00:00Z')
    const appt = makeAppt({
      clientName: 'Ana Pérez',
      clientPhone: '+56911112222',
      status: 'completed',
      amountPaid: 5000,
      price: 5000,
      paymentStatus: 'paid',
      scheduledAt: makeTimestamp(date),
    })

    const clients = deriveClients([appt])
    expect(clients).toHaveLength(1)

    const c = clients[0]
    expect(c.clientName).toBe('Ana Pérez')
    expect(c.totalSpent).toBe(5000)
    expect(c.appointmentCount).toBe(1)
    expect(c.pendingBalance).toBe(0)
    expect(c.appointments).toHaveLength(1)
    expect(c.lastVisitAt.toMillis()).toBe(date.getTime())
  })

  test('3. two completed appts for same client folds totalSpent and counts', () => {
    const appts = [
      makeAppt({ clientName: 'Bob', status: 'completed', amountPaid: 1000, price: 1000, paymentStatus: 'paid' }),
      makeAppt({ clientName: 'Bob', status: 'completed', amountPaid: 2000, price: 2000, paymentStatus: 'paid' }),
    ]

    const clients = deriveClients(appts)
    expect(clients).toHaveLength(1)

    const c = clients[0]
    expect(c.totalSpent).toBe(3000)
    expect(c.appointmentCount).toBe(2)
    expect(c.appointments).toHaveLength(2)
  })

  test('4. cancelled and no_show excluded from totalSpent but lastVisitAt still updated', () => {
    const jan01 = new Date('2026-01-01T10:00:00Z')
    const jun01 = new Date('2026-06-01T10:00:00Z')
    const mar01 = new Date('2026-03-01T10:00:00Z')

    const appts = [
      makeAppt({ clientName: 'Carlos', status: 'completed',  amountPaid: 1000, price: 1000, paymentStatus: 'paid',    scheduledAt: makeTimestamp(jan01) }),
      makeAppt({ clientName: 'Carlos', status: 'cancelled',  amountPaid: 5000, price: 5000, paymentStatus: 'paid',    scheduledAt: makeTimestamp(jun01) }),
      makeAppt({ clientName: 'Carlos', status: 'no_show',    amountPaid: 9000, price: 9000, paymentStatus: 'paid',    scheduledAt: makeTimestamp(mar01) }),
    ]

    const clients = deriveClients(appts)
    expect(clients).toHaveLength(1)

    const c = clients[0]
    expect(c.totalSpent).toBe(1000)
    expect(c.appointmentCount).toBe(1)
    expect(c.appointments).toHaveLength(3)
    // Jun-01 is most recent (cancelled still wins lastVisitAt)
    expect(c.lastVisitAt.toMillis()).toBe(jun01.getTime())
  })

  test('5. pendingBalance: partial + pending + completed-paid + partial-overpaid', () => {
    const appts = [
      makeAppt({ clientName: 'Diana', status: 'completed', price: 5000, amountPaid: 2000, paymentStatus: 'partial' }),  // +3000
      makeAppt({ clientName: 'Diana', status: 'completed', price: 1000, amountPaid: 0,    paymentStatus: 'pending' }),  // +1000
      makeAppt({ clientName: 'Diana', status: 'completed', price: 1000, amountPaid: 1000, paymentStatus: 'paid' }),     // +0
      makeAppt({ clientName: 'Diana', status: 'completed', price: 100,  amountPaid: 200,  paymentStatus: 'partial' }),  // +0 (overpaid)
    ]

    const clients = deriveClients(appts)
    expect(clients[0].pendingBalance).toBe(4000)
  })

  test('6. clientPhone: first real phone wins, later phones ignored', () => {
    const appts = [
      makeAppt({ clientName: 'Eva', clientPhone: undefined }),
      makeAppt({ clientName: 'Eva', clientPhone: '  ' }),
      makeAppt({ clientName: 'Eva', clientPhone: '+56911112222' }),
      makeAppt({ clientName: 'Eva', clientPhone: '+56999998888' }),
    ]

    const clients = deriveClients(appts)
    expect(clients[0].clientPhone).toBe('+56911112222')
  })

  test('7. lastVisitAt = max scheduledAt across all appts', () => {
    const mar01 = new Date('2026-03-01T10:00:00Z')
    const jan01 = new Date('2026-01-01T10:00:00Z')
    const jun01 = new Date('2026-06-01T10:00:00Z')

    const appts = [
      makeAppt({ clientName: 'Frank', scheduledAt: makeTimestamp(mar01) }),
      makeAppt({ clientName: 'Frank', scheduledAt: makeTimestamp(jan01) }),
      makeAppt({ clientName: 'Frank', scheduledAt: makeTimestamp(jun01) }),
    ]

    const clients = deriveClients(appts)
    expect(clients[0].lastVisitAt.toMillis()).toBe(jun01.getTime())
  })
})

describe('filterClients', () => {
  const ana = {
    clientName: 'Ana Pérez',
    clientPhone: '+56911112222',
    totalSpent: 5000,
    pendingBalance: 0,
    appointmentCount: 1,
    lastVisitAt: makeTimestamp(new Date('2026-01-01T10:00:00Z')),
    appointments: [],
  }
  const bob = {
    clientName: 'Bob Smith',
    clientPhone: '+56933334444',
    totalSpent: 3000,
    pendingBalance: 0,
    appointmentCount: 1,
    lastVisitAt: makeTimestamp(new Date('2026-02-01T10:00:00Z')),
    appointments: [],
  }
  const clients = [ana, bob]

  test('8a. name match is case-insensitive', () => {
    const result = filterClients(clients, 'ana')
    expect(result).toHaveLength(1)
    expect(result[0].clientName).toBe('Ana Pérez')
  })

  test('8b. phone digit match works', () => {
    const result = filterClients(clients, '3333')
    expect(result).toHaveLength(1)
    expect(result[0].clientName).toBe('Bob Smith')
  })

  test('8c. empty query returns SAME reference', () => {
    expect(filterClients(clients, '')).toBe(clients)
  })

  test('8d. unmatched query returns empty array', () => {
    expect(filterClients(clients, 'zzz')).toHaveLength(0)
  })
})

describe('sortClients', () => {
  const jan = makeTimestamp(new Date('2026-01-01T10:00:00Z'))
  const feb = makeTimestamp(new Date('2026-02-01T10:00:00Z'))
  const mar = makeTimestamp(new Date('2026-03-01T10:00:00Z'))

  const alice = { clientName: 'Alice', totalSpent: 1000, pendingBalance: 0, appointmentCount: 1, lastVisitAt: feb, appointments: [] }
  const carlos = { clientName: 'Carlos', totalSpent: 5000, pendingBalance: 0, appointmentCount: 2, lastVisitAt: jan, appointments: [] }
  const beatriz = { clientName: 'Beatriz', totalSpent: 3000, pendingBalance: 0, appointmentCount: 3, lastVisitAt: mar, appointments: [] }

  const clients = [alice, carlos, beatriz]

  test('9a. sort by name asc', () => {
    const sorted = sortClients(clients, 'name')
    expect(sorted.map(c => c.clientName)).toEqual(['Alice', 'Beatriz', 'Carlos'])
  })

  test('9b. sort by spent desc', () => {
    const sorted = sortClients(clients, 'spent')
    expect(sorted.map(c => c.totalSpent)).toEqual([5000, 3000, 1000])
  })

  test('9c. sort by recent desc', () => {
    const sorted = sortClients(clients, 'recent')
    expect(sorted.map(c => c.clientName)).toEqual(['Beatriz', 'Alice', 'Carlos'])
  })

  test('9d. original array is unchanged after sort', () => {
    const original = [...clients]
    sortClients(clients, 'name')
    sortClients(clients, 'spent')
    sortClients(clients, 'recent')
    expect(clients.map(c => c.clientName)).toEqual(original.map(c => c.clientName))
  })

  test('10a. tiebreaker on spent: same totalSpent → name asc', () => {
    const ts = makeTimestamp(new Date('2026-01-01T10:00:00Z'))
    const c1 = { clientName: 'Zara', totalSpent: 2000, pendingBalance: 0, appointmentCount: 1, lastVisitAt: ts, appointments: [] }
    const c2 = { clientName: 'Ana', totalSpent: 2000, pendingBalance: 0, appointmentCount: 1, lastVisitAt: ts, appointments: [] }
    const sorted = sortClients([c1, c2], 'spent')
    expect(sorted[0].clientName).toBe('Ana')
    expect(sorted[1].clientName).toBe('Zara')
  })

  test('10b. tiebreaker on recent: same lastVisitAt → name asc', () => {
    const ts = makeTimestamp(new Date('2026-06-01T10:00:00Z'))
    const c1 = { clientName: 'Zara', totalSpent: 1000, pendingBalance: 0, appointmentCount: 1, lastVisitAt: ts, appointments: [] }
    const c2 = { clientName: 'Ana', totalSpent: 2000, pendingBalance: 0, appointmentCount: 1, lastVisitAt: ts, appointments: [] }
    const sorted = sortClients([c1, c2], 'recent')
    expect(sorted[0].clientName).toBe('Ana')
    expect(sorted[1].clientName).toBe('Zara')
  })
})
