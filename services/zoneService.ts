import { Zone } from '@/domain/entities/zone'

function normalize(c: string) {
  return c.trim().toLowerCase()
}

export function getZoneForCommune(zones: Zone[], commune: string): Zone | undefined {
  return zones.find((z) => z.communes.some((c) => normalize(c) === normalize(commune)))
}
