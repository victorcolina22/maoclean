import React from 'react'
import { View, Text } from 'react-native'

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="text-4xl mb-4">📋</Text>
      <Text className="text-xl font-semibold text-neutral-800 text-center mb-2">{title}</Text>
      {description && (
        <Text className="text-sm text-neutral-500 text-center mb-6">{description}</Text>
      )}
      {action}
    </View>
  )
}
