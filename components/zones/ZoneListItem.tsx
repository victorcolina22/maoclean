import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Zone } from '@/domain/entities/zone'

interface ZoneListItemProps {
  zone: Zone
  onEdit: () => void
  onDelete: () => void
}

export function ZoneListItem({ zone, onEdit, onDelete }: ZoneListItemProps) {
  const preview = zone.communes.slice(0, 3).join(', ')
  const extra = zone.communes.length > 3 ? ` +${zone.communes.length - 3}` : ''

  return (
    <View className="flex-row items-center bg-white rounded-2xl border border-neutral-200 px-4 py-3 mb-3">
      <View className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: zone.color }} />
      <View className="flex-1">
        <Text className="text-sm font-semibold text-neutral-900">{zone.name}</Text>
        <Text className="text-xs text-neutral-500" numberOfLines={1}>
          {zone.communes.length === 0 ? 'Sin comunas' : preview + extra}
        </Text>
      </View>
      <Pressable onPress={onEdit} className="px-3 py-1 mr-2 rounded-lg bg-neutral-100">
        <Text className="text-xs text-neutral-700 font-medium">Editar</Text>
      </Pressable>
      <Pressable onPress={onDelete} className="px-3 py-1 rounded-lg bg-red-100">
        <Text className="text-xs text-red-600 font-medium">Eliminar</Text>
      </Pressable>
    </View>
  )
}
