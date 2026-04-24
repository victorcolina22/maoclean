import { Appointment, ProximitySuggestion } from '@/domain/entities/appointment'
import { haversine } from '@/utils/distanceUtils'

const NEARBY_THRESHOLD_KM = 2.0

export function calculateProximity(appointments: Appointment[]): ProximitySuggestion[] {
  const suggestions: ProximitySuggestion[] = []

  for (let i = 0; i < appointments.length; i++) {
    for (let j = i + 1; j < appointments.length; j++) {
      const a = appointments[i]
      const b = appointments[j]

      if (!a.location?.coordinates || !b.location?.coordinates) continue

      const distance = haversine(a.location.coordinates, b.location.coordinates)

      if (distance < NEARBY_THRESHOLD_KM) {
        suggestions.push({
          type: 'NEARBY',
          message: `Citas a solo ${distance.toFixed(1)} km`,
          appointmentIds: [a.id, b.id],
          distanceKm: distance,
          estimatedTravelMin: Math.round(distance * 3),
          priority: distance < 1 ? 'high' : 'medium',
        })
      }
    }
  }

  return suggestions.sort((a, b) => a.distanceKm - b.distanceKm)
}
