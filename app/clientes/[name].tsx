import React, { useMemo } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useAllAppointments } from '@/hooks/useAppointments'
import { deriveClients } from '@/utils/clientUtils'
import { ClientStatsHeader } from './_components/ClientStatsHeader'
import { PhoneLink } from '@/components/ui/PhoneLink'
import { AppointmentCard } from '@/components/appointments/AppointmentCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

export default function ClientDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>()
  const decodedName = decodeURIComponent(name ?? '')
  const { appointments, isLoading } = useAllAppointments()

  const client = useMemo(
    () => deriveClients(appointments).find((c) => c.clientName === decodedName) ?? null,
    [appointments, decodedName],
  )

  const history = useMemo(
    () =>
      client
        ? [...client.appointments].sort(
            (a, b) => b.scheduledAt.toMillis() - a.scheduledAt.toMillis(),
          )
        : [],
    [client],
  )

  if (isLoading) return <LoadingSpinner fullScreen />

  return (
    <>
      <Stack.Screen options={{ title: decodedName }} />
      {!client ? (
        <EmptyState
          title="Cliente no encontrado"
          description="Este cliente no tiene citas registradas."
        />
      ) : (
        <ScrollView
          className="flex-1 bg-neutral-50"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <ClientStatsHeader client={client} />
          {client.clientPhone && (
            <View className="px-4 pt-3 pb-1">
              <PhoneLink
                phone={client.clientPhone}
                textClassName="text-sm text-primary-600 font-medium"
              />
            </View>
          )}
          <Text className="text-base font-bold text-neutral-900 mt-6 mb-2 px-4">
            Historial ({history.length})
          </Text>
          <View className="px-4">
            {history.map((appt) => (
              <AppointmentCard key={appt.id} appointment={appt} />
            ))}
          </View>
        </ScrollView>
      )}
    </>
  )
}
