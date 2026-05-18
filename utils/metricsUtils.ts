import type { Timestamp } from 'firebase/firestore'
import type { Appointment } from '@/domain/entities/appointment'
import { SERVICE_LABELS } from '@/constants/services'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from '@/utils/dateUtils'

// ── Types ─────────────────────────────────────────────────────────────────────

export type MetricsPeriod = 'week' | 'month' | 'all'

export interface RankedBar {
  key: string
  label: string
  value: number
}

export interface TopClient {
  clientName: string
  totalPaid: number
  lastVisitAt: Timestamp
}

export interface MetricsResult {
  revenueCollected: number
  pendingRevenue: number
  appointmentCount: number
  topServices: RankedBar[]
  revenueByCommune: RankedBar[]
  topClients: TopClient[]
}

// ── Period range ──────────────────────────────────────────────────────────────

export function periodRange(
  period: MetricsPeriod,
  now?: Date,
): { start: Date; end: Date } | null {
  if (period === 'all') return null
  const ref = now ?? new Date()
  if (period === 'week') {
    return { start: startOfWeek(ref), end: endOfWeek(ref) }
  }
  return { start: startOfMonth(ref), end: endOfMonth(ref) }
}

// ── Main computation ──────────────────────────────────────────────────────────

export function computeMetrics(
  appointments: Appointment[],
  period: MetricsPeriod,
  now?: Date,
): MetricsResult {
  const range = periodRange(period, now ?? new Date())

  let revenueCollected = 0
  let pendingRevenue = 0
  let appointmentCount = 0

  // key → { label, value }
  const serviceAgg = new Map<string, { label: string; value: number }>()
  const communeAgg = new Map<string, { label: string; value: number }>()
  const clientAgg = new Map<string, { totalPaid: number; lastVisitAt: Timestamp }>()

  for (const appt of appointments) {
    // Status filter
    if (appt.status === 'cancelled' || appt.status === 'no_show') continue

    // Period filter
    if (range) {
      const t = appt.scheduledAt.toDate().getTime()
      if (t < range.start.getTime() || t > range.end.getTime()) continue
    }

    const paid = appt.amountPaid ?? 0
    const price = appt.price ?? 0

    revenueCollected += paid

    if (appt.paymentStatus === 'pending' || appt.paymentStatus === 'partial') {
      pendingRevenue += Math.max(0, price - paid)
    }

    appointmentCount++

    // Services aggregation
    for (const item of appt.items ?? []) {
      const prev = serviceAgg.get(item.type)
      serviceAgg.set(item.type, {
        label: SERVICE_LABELS[item.type] ?? item.type,
        value: (prev?.value ?? 0) + 1,
      })
    }

    // Commune aggregation
    const commune = appt.location?.commune?.trim() || 'Sin comuna'
    const prevCommune = communeAgg.get(commune)
    communeAgg.set(commune, {
      label: commune,
      value: (prevCommune?.value ?? 0) + paid,
    })

    // Client aggregation
    const name = appt.clientName
    const prevClient = clientAgg.get(name)
    if (!prevClient) {
      clientAgg.set(name, { totalPaid: paid, lastVisitAt: appt.scheduledAt })
    } else {
      const isLater =
        appt.scheduledAt.toMillis() > prevClient.lastVisitAt.toMillis()
      clientAgg.set(name, {
        totalPaid: prevClient.totalPaid + paid,
        lastVisitAt: isLater ? appt.scheduledAt : prevClient.lastVisitAt,
      })
    }
  }

  const rankTop5 = (
    map: Map<string, { label: string; value: number }>,
  ): RankedBar[] =>
    [...map.entries()]
      .map(([key, { label, value }]) => ({ key, label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

  const topClients: TopClient[] = [...clientAgg.entries()]
    .map(([clientName, { totalPaid, lastVisitAt }]) => ({
      clientName,
      totalPaid,
      lastVisitAt,
    }))
    .sort((a, b) => b.totalPaid - a.totalPaid)
    .slice(0, 5)

  return {
    revenueCollected,
    pendingRevenue,
    appointmentCount,
    topServices: rankTop5(serviceAgg),
    revenueByCommune: rankTop5(communeAgg),
    topClients,
  }
}
