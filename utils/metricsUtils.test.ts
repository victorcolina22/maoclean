import { computeMetrics, periodRange } from './metricsUtils'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from './dateUtils'
import type { Appointment, AppointmentStatus, PaymentStatus, ServiceItem, ServiceType } from '@/domain/entities/appointment'
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
const DEFAULT_DATE = new Date('2026-05-01T10:00:00Z')

function makeAppt(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 'appt-default',
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

function makeItem(type: ServiceType): ServiceItem {
  return { type, label: type, qty: 1, unitPrice: 1000 }
}

// ── Test suite ────────────────────────────────────────────────────────────────

const NOW = new Date('2026-05-17T12:00:00Z')

describe('periodRange', () => {
  test('1. returns null for period "all"', () => {
    expect(periodRange('all', NOW)).toBeNull()
  })

  test('2. period "week" returns correct start/end', () => {
    const result = periodRange('week', NOW)
    expect(result).not.toBeNull()
    expect(result!.start.getTime()).toBe(startOfWeek(NOW).getTime())
    expect(result!.end.getTime()).toBe(endOfWeek(NOW).getTime())
  })

  test('3. period "month" returns correct start/end', () => {
    const result = periodRange('month', NOW)
    expect(result).not.toBeNull()
    expect(result!.start.getTime()).toBe(startOfMonth(NOW).getTime())
    expect(result!.end.getTime()).toBe(endOfMonth(NOW).getTime())
  })
})

describe('computeMetrics — status filtering', () => {
  test('4. excludes cancelled and no_show appointments', () => {
    const appts = [
      makeAppt({ id: 'a1', status: 'cancelled', amountPaid: 500, price: 500, paymentStatus: 'paid' }),
      makeAppt({ id: 'a2', status: 'no_show', amountPaid: 300, price: 300, paymentStatus: 'paid' }),
      makeAppt({ id: 'a3', status: 'completed', amountPaid: 1000, price: 1000, paymentStatus: 'paid' }),
    ]
    const result = computeMetrics(appts, 'all', NOW)
    expect(result.appointmentCount).toBe(1)
  })
})

describe('computeMetrics — period filtering', () => {
  test('5. filters by period correctly', () => {
    const thisWeek = new Date('2026-05-14T10:00:00Z') // Thursday of NOW's week
    const longAgo = new Date('2026-03-15T10:00:00Z')  // 60+ days ago

    const appts = [
      makeAppt({ id: 'w1', scheduledAt: makeTimestamp(thisWeek), status: 'completed', amountPaid: 1000, price: 1000, paymentStatus: 'paid' }),
      makeAppt({ id: 'o1', scheduledAt: makeTimestamp(longAgo), status: 'completed', amountPaid: 2000, price: 2000, paymentStatus: 'paid' }),
    ]

    const weekResult = computeMetrics(appts, 'week', NOW)
    expect(weekResult.appointmentCount).toBe(1)

    const allResult = computeMetrics(appts, 'all', NOW)
    expect(allResult.appointmentCount).toBe(2)
  })
})

describe('computeMetrics — revenue', () => {
  test('6. revenueCollected is sum of amountPaid for included appointments', () => {
    const appts = [
      makeAppt({ id: 'r1', amountPaid: 1000, price: 1000, paymentStatus: 'paid', status: 'completed' }),
      makeAppt({ id: 'r2', amountPaid: 2000, price: 2000, paymentStatus: 'paid', status: 'completed' }),
      makeAppt({ id: 'r3', amountPaid: 500, price: 500, paymentStatus: 'paid', status: 'completed' }),
    ]
    const result = computeMetrics(appts, 'all', NOW)
    expect(result.revenueCollected).toBe(3500)
  })

  test('7. pendingRevenue — partial, pending, overpaid cases', () => {
    const appts = [
      // partial: price=5000, paid=2000 → +3000
      makeAppt({ id: 'p1', amountPaid: 2000, price: 5000, paymentStatus: 'partial', status: 'completed' }),
      // pending: price=1000, paid=0 → +1000
      makeAppt({ id: 'p2', amountPaid: 0, price: 1000, paymentStatus: 'pending', status: 'completed' }),
      // overpaid: price=100, paid=200 → +0 (max(0, ...))
      makeAppt({ id: 'p3', amountPaid: 200, price: 100, paymentStatus: 'partial', status: 'completed' }),
    ]
    const result = computeMetrics(appts, 'all', NOW)
    expect(result.pendingRevenue).toBe(4000)
  })
})

describe('computeMetrics — topServices', () => {
  test('8. topServices returns top 5, excludes 6th', () => {
    // 7 service types but we only have 7 in ServiceType; use 6 of them with counts [6,5,4,3,2,1]
    const serviceTypes: ServiceType[] = ['casa', 'apartamento', 'muebles', 'alfombra', 'sillas', 'carro']
    const counts = [6, 5, 4, 3, 2, 1]

    const appts: Appointment[] = []
    serviceTypes.forEach((type, idx) => {
      for (let i = 0; i < counts[idx]; i++) {
        appts.push(
          makeAppt({
            id: `svc-${type}-${i}`,
            items: [makeItem(type)],
            status: 'completed',
            amountPaid: 1000,
            price: 1000,
            paymentStatus: 'paid',
          })
        )
      }
    })

    const result = computeMetrics(appts, 'all', NOW)
    expect(result.topServices).toHaveLength(5)
    expect(result.topServices[0].value).toBe(6)
    // The 6th service (carro with count=1) is excluded
    const keys = result.topServices.map(s => s.key)
    expect(keys).not.toContain('carro')
  })
})

describe('computeMetrics — revenueByCommune', () => {
  test('9. groups blank/undefined commune as "Sin comuna"', () => {
    const appts = [
      makeAppt({ id: 'c1', location: { address: '', coordinates: {} as any, commune: 'Las Condes' }, amountPaid: 3000, price: 3000, paymentStatus: 'paid', status: 'completed' }),
      makeAppt({ id: 'c2', location: { address: '', coordinates: {} as any, commune: '  ' }, amountPaid: 1000, price: 1000, paymentStatus: 'paid', status: 'completed' }),
      makeAppt({ id: 'c3', location: { address: '', coordinates: {} as any, commune: undefined as any }, amountPaid: 500, price: 500, paymentStatus: 'paid', status: 'completed' }),
    ]

    const result = computeMetrics(appts, 'all', NOW)
    const sinComuna = result.revenueByCommune.find(r => r.key === 'Sin comuna')
    const lasCondes = result.revenueByCommune.find(r => r.key === 'Las Condes')

    expect(sinComuna?.value).toBe(1500)
    expect(lasCondes?.value).toBe(3000)
  })
})

describe('computeMetrics — topClients', () => {
  test('10. same client in 2 appts → totalPaid is sum, lastVisitAt is most recent', () => {
    const jan1 = new Date('2026-01-01T10:00:00Z')
    const mar1 = new Date('2026-03-01T10:00:00Z')

    const appts = [
      makeAppt({ id: 'cl1', clientName: 'Ana Pérez', amountPaid: 1000, scheduledAt: makeTimestamp(jan1), status: 'completed', price: 1000, paymentStatus: 'paid' }),
      makeAppt({ id: 'cl2', clientName: 'Ana Pérez', amountPaid: 2000, scheduledAt: makeTimestamp(mar1), status: 'completed', price: 2000, paymentStatus: 'paid' }),
    ]

    const result = computeMetrics(appts, 'all', NOW)
    expect(result.topClients).toHaveLength(1)
    expect(result.topClients[0].totalPaid).toBe(3000)
    expect(result.topClients[0].lastVisitAt.toDate().getTime()).toBe(mar1.getTime())
  })

  test('11. topClients sorted desc, sliced to 5 (6 clients → length 5)', () => {
    const appts = [1000, 2000, 3000, 4000, 5000, 6000].map((paid, idx) =>
      makeAppt({
        id: `multi-${idx}`,
        clientName: `Cliente ${idx}`,
        amountPaid: paid,
        price: paid,
        paymentStatus: 'paid',
        status: 'completed',
      })
    )

    const result = computeMetrics(appts, 'all', NOW)
    expect(result.topClients).toHaveLength(5)
    expect(result.topClients[0].totalPaid).toBe(6000)
  })
})

describe('computeMetrics — empty input', () => {
  test('12. empty appointments array returns all zeros and empty arrays', () => {
    const result = computeMetrics([], 'all', NOW)
    expect(result.revenueCollected).toBe(0)
    expect(result.pendingRevenue).toBe(0)
    expect(result.appointmentCount).toBe(0)
    expect(result.topServices).toHaveLength(0)
    expect(result.revenueByCommune).toHaveLength(0)
    expect(result.topClients).toHaveLength(0)
  })
})
