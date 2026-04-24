import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { clientRepository } from '@/services/clientRepository'
import { Client } from '@/domain/entities/client'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { useClients } from '@/hooks/useClients'
import { formatPhone } from '@/utils/formatUtils'

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { remove } = useClients()
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    clientRepository.getById(id).then((result) => {
      if (result.success) setClient(result.data)
      setIsLoading(false)
    })
  }, [id])

  const handleDelete = () => {
    Alert.alert(
      'Eliminar cliente',
      '¿Estás seguro? Se eliminará el cliente pero no sus citas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!id) return
            await remove(id)
            router.back()
          },
        },
      ]
    )
  }

  if (isLoading) return <LoadingSpinner fullScreen />
  if (!client) return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-neutral-500">Cliente no encontrado.</Text>
    </View>
  )

  return (
    <ScrollView className="flex-1 bg-neutral-50 px-4 pt-4">
      <Card className="mb-4">
        <View className="items-center mb-6">
          <View className="w-16 h-16 rounded-full bg-primary-100 items-center justify-center mb-3">
            <Text className="text-primary-700 font-bold text-2xl">
              {client.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-xl font-bold text-neutral-900">{client.name}</Text>
        </View>

        <View className="gap-3">
          <Row label="Teléfono" value={formatPhone(client.phone)} />
          {client.email && <Row label="Email" value={client.email} />}
          {client.notes && <Row label="Notas" value={client.notes} />}
        </View>
      </Card>

      <View className="gap-3 mb-8">
        <Button
          label="Eliminar cliente"
          variant="danger"
          onPress={handleDelete}
          fullWidth
        />
      </View>
    </ScrollView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-neutral-500">{label}</Text>
      <Text className="text-sm text-neutral-800 font-medium text-right flex-1 ml-4">{value}</Text>
    </View>
  )
}
