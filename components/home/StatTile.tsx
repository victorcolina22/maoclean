import React from 'react'
import { Pressable, View, Text } from 'react-native'

interface StatTileProps {
  label: string
  count: number
  icon: string
  bgClass: string
  borderClass: string
  onPress: () => void
}

export function StatTile({
  label,
  count,
  icon,
  bgClass,
  borderClass,
  onPress,
}: StatTileProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`w-[48%] rounded-xl border border-neutral-200 border-l-4 p-4 mb-3 shadow-sm ${bgClass} ${borderClass}`}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-3xl font-bold text-neutral-900">{count}</Text>
        <Text className="text-xl">{icon}</Text>
      </View>
      <Text className="text-sm text-neutral-600">{label}</Text>
    </Pressable>
  )
}
