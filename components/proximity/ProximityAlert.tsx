import React from 'react'
import { View, Text } from 'react-native'
import { useProximityStore } from '@/stores/useProximityStore'
import { SuggestionCard } from './SuggestionCard'

export function ProximityAlert() {
  const { suggestions } = useProximityStore()

  if (suggestions.length === 0) return null

  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-neutral-700 mb-2">
        🗺️ Sugerencias de proximidad
      </Text>
      {suggestions.map((s, i) => (
        <SuggestionCard key={i} suggestion={s} />
      ))}
    </View>
  )
}
