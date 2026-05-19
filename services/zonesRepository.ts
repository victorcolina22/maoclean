import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { Zone, MAX_ZONES } from '@/domain/entities/zone'
import { Result, ok, err } from '@/utils/result'

function zonesDoc(uid: string) {
  return doc(db, 'users', uid, 'settings', 'zones')
}

function isValidZone(z: unknown): z is Zone {
  if (!z || typeof z !== 'object') return false
  const o = z as Record<string, unknown>
  return (
    typeof o.id === 'string' && o.id.length > 0 &&
    typeof o.name === 'string' && o.name.length > 0 &&
    typeof o.color === 'string' && o.color.length > 0 &&
    Array.isArray(o.communes)
  )
}

export const zonesRepository = {
  async getZones(uid: string): Promise<Result<Zone[]>> {
    try {
      const snap = await getDoc(zonesDoc(uid))
      if (!snap.exists()) return ok([])
      const raw = snap.data()?.zones
      if (!Array.isArray(raw)) return ok([])
      const valid = (raw as unknown[]).filter(isValidZone).slice(0, MAX_ZONES)
      return ok(valid)
    } catch {
      return err('No se pudo cargar las zonas.')
    }
  },

  async saveZones(uid: string, zones: Zone[]): Promise<Result<undefined>> {
    try {
      await setDoc(zonesDoc(uid), { zones }, { merge: true })
      return ok(undefined)
    } catch {
      return err('No se pudo guardar las zonas. Intenta de nuevo.')
    }
  },
}
