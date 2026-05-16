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
  const isCommune = suggestion.type === 'GROUP_BY_COMMUNE'

  return (
    <View className={`border-l-4 rounded-r-xl px-4 py-3 mb-2 ${priorityColors[suggestion.priority]}`}>
      <View className="flex-row items-center gap-2">
        <Text className="text-sm">{isCommune ? '📍' : '🔗'}</Text>
        <Text className="text-sm font-semibold text-neutral-800 flex-1">
          {suggestion.message}
        </Text>
        {isCommune && (
          <View className="bg-neutral-700 rounded-full px-2 py-0.5">
            <Text className="text-xs text-white font-bold">
              {suggestion.appointmentIds.length}
            </Text>
          </View>
        )}
      </View>
      {!isCommune && (
        <Text className="text-xs text-neutral-500 mt-0.5">
          ~{suggestion.estimatedTravelMin} min de traslado
        </Text>
      )}
    </View>
  )
}
