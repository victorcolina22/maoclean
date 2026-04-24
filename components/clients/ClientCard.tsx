import React from 'react'
import { Pressable, View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { Client } from '@/domain/entities/client'
import { Card } from '@/components/ui/Card'
import { formatPhone } from '@/utils/formatUtils'

interface ClientCardProps {
  client: Client
}

export function ClientCard({ client }: ClientCardProps) {
  const router = useRouter()

  return (
    <Pressable onPress={() => router.push(`/client/${client.id}`)}>
      <Card className="mb-3">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mr-3">
            <Text className="text-primary-700 font-bold text-base">
              {client.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-neutral-900">{client.name}</Text>
            <Text className="text-sm text-neutral-500">{formatPhone(client.phone)}</Text>
          </View>
          {client.email && (
            <Text className="text-xs text-neutral-400" numberOfLines={1}>
              {client.email}
            </Text>
          )}
        </View>
      </Card>
    </Pressable>
  )
}
