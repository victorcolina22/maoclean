import { GeoPoint } from 'firebase/firestore'
import { Result, ok, err } from '@/utils/result'

const MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

interface GeocodeResult {
  address: string
  coordinates: GeoPoint
  commune: string
}

export async function geocodeAddress(address: string): Promise<Result<GeocodeResult>> {
  try {
    const encoded = encodeURIComponent(`${address}, Santiago, Chile`)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${MAPS_API_KEY}`

    const res = await fetch(url)
    const json = await res.json()

    if (json.status !== 'OK' || !json.results?.length) {
      return err('No se encontró la dirección. Verifica e intenta de nuevo.')
    }

    const result = json.results[0]
    const { lat, lng } = result.geometry.location

    const communeComponent = result.address_components?.find(
      (c: { types: string[]; long_name: string }) =>
        c.types.includes('locality') || c.types.includes('sublocality')
    )

    return ok({
      address: result.formatted_address,
      coordinates: new GeoPoint(lat, lng),
      commune: communeComponent?.long_name ?? '',
    })
  } catch {
    return err('Error al geocodificar la dirección.')
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<Result<string>> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAPS_API_KEY}`
    const res = await fetch(url)
    const json = await res.json()

    if (json.status !== 'OK' || !json.results?.length) {
      return err('No se pudo obtener la dirección.')
    }

    return ok(json.results[0].formatted_address)
  } catch {
    return err('Error al obtener la dirección.')
  }
}
