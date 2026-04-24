import React from 'react'
import { View, Text } from 'react-native'

type BadgeColor = 'blue' | 'green' | 'yellow' | 'red' | 'gray'

interface BadgeProps {
  label: string
  color?: BadgeColor
}

const colorClasses: Record<BadgeColor, { container: string; text: string }> = {
  blue: { container: 'bg-blue-100', text: 'text-blue-700' },
  green: { container: 'bg-green-100', text: 'text-green-700' },
  yellow: { container: 'bg-yellow-100', text: 'text-yellow-700' },
  red: { container: 'bg-red-100', text: 'text-red-700' },
  gray: { container: 'bg-neutral-100', text: 'text-neutral-600' },
}

export function Badge({ label, color = 'blue' }: BadgeProps) {
  const { container, text } = colorClasses[color]
  return (
    <View className={`${container} rounded-full px-2.5 py-0.5 self-start`}>
      <Text className={`${text} text-xs font-medium`}>{label}</Text>
    </View>
  )
}
