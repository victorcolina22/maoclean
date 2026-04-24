import { useState, useCallback } from 'react'
import * as Location from 'expo-location'
import { Result, ok, err } from '@/utils/result'

interface Coords {
  latitude: number
  longitude: number
}

export function useLocation() {
  const [location, setLocation] = useState<Coords | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const getCurrentLocation = useCallback(async (): Promise<Result<Coords>> => {
    setIsLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        return err('Permiso de ubicación denegado.')
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
      setLocation(coords)
      return ok(coords)
    } catch {
      return err('No se pudo obtener la ubicación.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { location, isLoading, getCurrentLocation }
}
