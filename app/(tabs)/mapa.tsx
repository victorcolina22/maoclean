import React from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useAppointmentsStore } from '@/stores/useAppointmentsStore'
import { AppMapView } from '@/components/map/MapView'
import { AppointmentMarker } from '@/components/map/AppointmentMarker'

export default function MapaScreen() {
  const router = useRouter()
  const { appointments } = useAppointmentsStore()

  const withCoords = appointments.filter(
    (a) => a.location?.coordinates?.latitude && a.location?.coordinates?.longitude
  )

  return (
    <View className="flex-1">
      <View className="absolute top-4 left-4 right-4 z-10">
        <Text className="text-base font-semibold text-neutral-900 bg-white rounded-xl px-4 py-2 shadow-sm border border-neutral-100">
          🗺️ {withCoords.length} citas en el mapa
        </Text>
      </View>

      <AppMapView>
        {withCoords.map((a) => (
          <AppointmentMarker
            key={a.id}
            appointment={a}
            onPress={() => router.push(`/appointment/${a.id}`)}
          />
        ))}
      </AppMapView>
    </View>
  )
}
