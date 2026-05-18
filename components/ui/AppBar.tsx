import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDrawerStore } from '@/stores/useDrawerStore'

interface AppBarProps {
  title: string
  subtitle?: string
  showHamburger?: boolean
  leftSlot?: React.ReactNode
  rightSlot?: React.ReactNode
}

const toggle = (s: { toggle: () => void }) => s.toggle

export default function AppBar({
  title,
  subtitle,
  showHamburger = true,
  leftSlot,
  rightSlot,
}: AppBarProps) {
  const insets = useSafeAreaInsets()
  const toggleDrawer = useDrawerStore(toggle)

  return (
    <View
      className="bg-white border-b border-neutral-200 flex-row items-center px-4 pb-3"
      style={{ paddingTop: insets.top + 12 }}
    >
      {leftSlot ? leftSlot : showHamburger && (
        <Pressable onPress={toggleDrawer} className="mr-3 p-1">
          <Text className="text-neutral-700 text-xl">☰</Text>
        </Pressable>
      )}
      <View className="flex-1">
        <Text className="text-2xl font-bold text-neutral-900">{title}</Text>
        {subtitle && (
          <Text className="text-sm text-neutral-500 capitalize">{subtitle}</Text>
        )}
      </View>
      {rightSlot ?? <View className="w-10" />}
    </View>
  )
}
