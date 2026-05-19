import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { SANTIAGO_COMMUNES } from '@/constants/communes'
import { Zone } from '@/domain/entities/zone'

interface ZoneCommunePickerProps {
  selected: string[]
  zones: Zone[]
  currentZoneId?: string
  onChange: (communes: string[]) => void
}

export function ZoneCommunePicker({ selected, zones, currentZoneId, onChange }: ZoneCommunePickerProps) {
  const toggle = (commune: string) => {
    if (selected.includes(commune)) {
      onChange(selected.filter((c) => c !== commune))
    } else {
      onChange([...selected, commune])
    }
  }

  return (
    <View className="mb-4">
      {SANTIAGO_COMMUNES.map((commune) => {
        const isSelected = selected.includes(commune)
        const owner = zones.find(
          (z) => z.id !== currentZoneId && z.communes.includes(commune)
        )
        return (
          <Pressable
            key={commune}
            onPress={() => toggle(commune)}
            className="flex-row items-center justify-between py-2 border-b border-neutral-100"
          >
            <Text className={`text-sm ${isSelected ? 'text-primary-600 font-medium' : 'text-neutral-700'}`}>
              {commune}
            </Text>
            <View className="flex-row items-center gap-2">
              {owner && (
                <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: owner.color }}>
                  <Text className="text-white text-xs">{owner.name}</Text>
                </View>
              )}
              <View className={`w-5 h-5 rounded border-2 items-center justify-center ${isSelected ? 'bg-primary-600 border-primary-600' : 'border-neutral-300'}`}>
                {isSelected && <Text className="text-white text-xs font-bold">✓</Text>}
              </View>
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}
