import React from 'react'
import { View, Text, FlatList, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useClients } from '@/hooks/useClients'
import { ClientCard } from '@/components/clients/ClientCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

export default function ClientesScreen() {
  const router = useRouter()
  const { clients, isLoading } = useClients()

  const sorted = [...clients].sort((a, b) => a.name.localeCompare(b.name, 'es'))

  return (
    <View className="flex-1 bg-neutral-50">
      <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-neutral-900">Clientes</Text>
        <Pressable
          onPress={() => router.push('/client/new')}
          className="bg-primary-600 rounded-xl px-4 py-2"
        >
          <Text className="text-white font-semibold">+ Cliente</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}
          renderItem={({ item }) => <ClientCard client={item} />}
          ListEmptyComponent={
            <EmptyState
              title="Sin clientes"
              description="Agrega tu primer cliente para poder crear citas."
              action={
                <Button
                  label="Nuevo cliente"
                  onPress={() => router.push('/client/new')}
                />
              }
            />
          }
        />
      )}
    </View>
  )
}
