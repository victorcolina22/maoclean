import React from 'react'
import { View, Text } from 'react-native'
import { ProximitySuggestion } from '@/domain/entities/appointment'

interface SuggestionCardProps {
  suggestion: ProximitySuggestion
}

const priorityColors = {
  high: 'border-l-green-500 bg-green-50',
  medium: 'border-l-blue-500 bg-blue-50',
  low: 'border-l-neutral-300 bg-neutral-50',
}

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
  return (
    <View className={`border-l-4 rounded-r-xl px-4 py-3 mb-2 ${priorityColors[suggestion.priority]}`}>
      <Text className="text-sm font-semibold text-neutral-800">{suggestion.message}</Text>
      <Text className="text-xs text-neutral-500 mt-0.5">
        ~{suggestion.estimatedTravelMin} min de traslado
      </Text>
    </View>
  )
}
