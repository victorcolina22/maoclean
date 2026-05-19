import React from 'react'
import { View, Pressable } from 'react-native'
import { ZONE_PALETTE } from '@/constants/zone-colors'

interface ZoneColorPickerProps {
  selected: string
  usedColors: string[]
  onChange: (color: string) => void
}

export function ZoneColorPicker({ selected, usedColors, onChange }: ZoneColorPickerProps) {
  return (
    <View className="flex-row flex-wrap gap-3 mb-4">
      {ZONE_PALETTE.map((c) => {
        const isDisabled = usedColors.includes(c) && c !== selected
        return (
          <Pressable
            key={c}
            onPress={() => !isDisabled && onChange(c)}
            style={{ backgroundColor: c, opacity: isDisabled ? 0.35 : 1 }}
            className={`w-8 h-8 rounded-full ${selected === c ? 'border-2 border-neutral-900' : ''}`}
          />
        )
      })}
    </View>
  )
}
