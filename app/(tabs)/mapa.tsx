import React, { useMemo } from 'react'
import { View, Text, Pressable, ScrollView, Linking } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppointmentsStore } from '@/stores/useAppointmentsStore'
import { AppMapView } from '@/components/map/MapView'
import { AppointmentMarker } from '@/components/map/AppointmentMarker'
import { useDrawerStore } from '@/stores/useDrawerStore'
import { groupByCommune } from '@/services/proximityService'

function buildMapsUrl(appointments: { location: { coordinates: { latitude: number; longitude: number } } }[]): string {
  const waypoints = appointments
    .map((a) => `${a.location.coordinates.latitude},${a.location.coordinates.longitude}`)
    .join('|')
  return `https://www.google.com/maps/dir/?api=1&waypoints=${waypoints}&travelmode=driving`
}

export default function MapaScreen() {
  const router = useRouter()
  const { appointments } = useAppointmentsStore()
  const insets = useSafeAreaInsets()
  const toggle = useDrawerStore((s) => s.toggle)

  const withCoords = appointments.filter(
    (a) => a.location?.coordinates?.latitude && a.location?.coordinates?.longitude
  )

  const communeGroups = useMemo(
    () =>
      Array.from(groupByCommune(withCoords).entries())
        .filter(([, group]) => group.length > 0)
        .sort((a, b) => b[1].length - a[1].length),
    [withCoords]
  )

  return (
    <View className="flex-1">
      <Pressable
        onPress={toggle}
        style={{ position: 'absolute', top: insets.top + 8, left: 16, zIndex: 20 }}
        className="bg-white rounded-xl p-2"
      >
        <Text className="text-neutral-700 text-xl">☰</Text>
      </Pressable>

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

      {communeGroups.length > 0 && (
        <View
          className="absolute left-0 right-0 bg-white border-t border-neutral-100"
          style={{ bottom: insets.bottom, zIndex: 10 }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 10 }}
          >
            {communeGroups.map(([commune, group]) => (
              <Pressable
                key={commune}
                onPress={() => Linking.openURL(buildMapsUrl(group))}
                className="flex-row items-center gap-2 bg-primary-600 rounded-xl px-4 py-2"
              >
                <Text className="text-white text-sm">🧭</Text>
                <Text className="text-white text-sm font-medium">{commune}</Text>
                <View className="bg-white/20 rounded-full px-1.5">
                  <Text className="text-white text-xs font-bold">{group.length}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}
