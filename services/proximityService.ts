import { Appointment, ProximitySuggestion } from '@/domain/entities/appointment'
import { haversine } from '@/utils/distanceUtils'

const NEARBY_THRESHOLD_KM = 2.0

function hasValidCoords(a: Appointment): boolean {
  const c = a.location?.coordinates
  return !!c && (c.latitude !== 0 || c.longitude !== 0)
}

export function groupByCommune(appointments: Appointment[]): Map<string, Appointment[]> {
  const map = new Map<string, Appointment[]>()
  for (const a of appointments) {
    const commune = a.location?.commune?.trim()
    if (!commune) continue
    if (!map.has(commune)) map.set(commune, [])
    map.get(commune)!.push(a)
  }
  return map
}

export function calculateProximity(appointments: Appointment[]): ProximitySuggestion[] {
  const suggestions: ProximitySuggestion[] = []

  // GROUP_BY_COMMUNE: 2+ citas en la misma comuna
  for (const [commune, group] of groupByCommune(appointments).entries()) {
    if (group.length < 2) continue
    suggestions.push({
      type: 'GROUP_BY_COMMUNE',
      message: `${group.length} citas en ${commune}`,
      appointmentIds: group.map((a) => a.id),
      distanceKm: 0,
      estimatedTravelMin: 0,
      priority: group.length >= 3 ? 'high' : 'medium',
    })
  }

  // NEARBY: pares de citas cercanas en distinta comuna
  for (let i = 0; i < appointments.length; i++) {
    for (let j = i + 1; j < appointments.length; j++) {
      const a = appointments[i]
      const b = appointments[j]

      if (!hasValidCoords(a) || !hasValidCoords(b)) continue

      const sameCommune =
        a.location.commune &&
        b.location.commune &&
        a.location.commune.trim().toLowerCase() === b.location.commune.trim().toLowerCase()
      if (sameCommune) continue

      const distance = haversine(a.location.coordinates, b.location.coordinates)
      if (distance < NEARBY_THRESHOLD_KM) {
        suggestions.push({
          type: 'NEARBY',
          message: `${a.clientName} y ${b.clientName} a ${distance.toFixed(1)} km`,
          appointmentIds: [a.id, b.id],
          distanceKm: distance,
          estimatedTravelMin: Math.round(distance * 3),
          priority: distance < 1 ? 'high' : 'medium',
        })
      }
    }
  }

  return suggestions.sort((a, b) => {
    if (a.type === 'GROUP_BY_COMMUNE' && b.type !== 'GROUP_BY_COMMUNE') return -1
    if (a.type !== 'GROUP_BY_COMMUNE' && b.type === 'GROUP_BY_COMMUNE') return 1
    return a.distanceKm - b.distanceKm
  })
}
