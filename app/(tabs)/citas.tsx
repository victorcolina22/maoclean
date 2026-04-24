import React, { useState } from 'react'
import { View, Text, FlatList, Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useAppointmentsStore } from '@/stores/useAppointmentsStore'
import { useClientsStore } from '@/stores/useClientsStore'
import { AppointmentCard } from '@/components/appointments/AppointmentCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { AppointmentStatus } from '@/domain/entities/appointment'

const STATUS_FILTERS: { label: string; value: AppointmentStatus | 'all' }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Agendadas', value: 'scheduled' },
  { label: 'En curso', value: 'in_progress' },
  { label: 'Completadas', value: 'completed' },
  { label: 'Canceladas', value: 'cancelled' },
]

export default function CitasScreen() {
  const router = useRouter()
  const { appointments, isLoading } = useAppointmentsStore()
  const { clients } = useClientsStore()
  const [filter, setFilter] = useState<AppointmentStatus | 'all'>('all')

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]))

  const filtered = filter === 'all'
    ? appointments
    : appointments.filter((a) => a.status === filter)

  const sorted = [...filtered].sort(
    (a, b) => b.scheduledAt.seconds - a.scheduledAt.seconds
  )

  return (
    <View className="flex-1 bg-neutral-50">
      <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-neutral-900">Citas</Text>
        <Pressable
          onPress={() => router.push('/appointment/new')}
          className="bg-primary-600 rounded-xl px-4 py-2"
        >
          <Text className="text-white font-semibold">+ Nueva</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}
        className="max-h-12"
      >
        {STATUS_FILTERS.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full border ${
              filter === f.value
                ? 'bg-primary-600 border-primary-600'
                : 'bg-white border-neutral-200'
            }`}
          >
            <Text className={filter === f.value ? 'text-white text-sm font-medium' : 'text-neutral-600 text-sm'}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <AppointmentCard appointment={item} clientName={clientMap[item.clientId]} />
          )}
          ListEmptyComponent={
            <EmptyState
              title="Sin citas"
              description="No hay citas con este filtro."
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
