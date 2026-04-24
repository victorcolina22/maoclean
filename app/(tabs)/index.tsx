import React from 'react'
import { View, Text, FlatList, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useAppointments } from '@/hooks/useAppointments'
import { useClientsStore } from '@/stores/useClientsStore'
import { AppointmentCard } from '@/components/appointments/AppointmentCard'
import { ProximityAlert } from '@/components/proximity/ProximityAlert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/utils/dateUtils'

export default function HomeScreen() {
  const router = useRouter()
  const { appointments, isLoading } = useAppointments()
  const { clients } = useClientsStore()
  const today = new Date()

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]))

  const sorted = [...appointments].sort(
    (a, b) => a.scheduledAt.seconds - b.scheduledAt.seconds
  )

  return (
    <View className="flex-1 bg-neutral-50">
      <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold text-neutral-900">Hoy</Text>
          <Text className="text-sm text-neutral-500 capitalize">{formatDate(today)}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/appointment/new')}
          className="bg-primary-600 rounded-xl px-4 py-2"
        >
          <Text className="text-white font-semibold">+ Cita</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}
          ListHeaderComponent={<ProximityAlert />}
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={item}
              clientName={clientMap[item.clientId]}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title="Sin citas hoy"
              description="Agrega tu primera cita del día."
              action={
                <Button
                  label="Nueva cita"
                  onPress={() => router.push('/appointment/new')}
                />
              }
            />
          }
        />
      )}
    </View>
  )
}
