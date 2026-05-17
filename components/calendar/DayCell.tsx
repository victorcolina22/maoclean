import '@/utils/dateUtils'           // side-effect: registers dayjs utc + timezone plugins
import React from 'react'
import { View, Text, Pressable } from 'react-native'
import dayjs from 'dayjs'
import { Appointment } from '@/domain/entities/appointment'
import { STATUS_COLORS, TZ } from '@/constants/calendar'

interface DayCellProps {
  dayKey: string
  appointments: Appointment[]
  isSelected: boolean
  isToday: boolean
  isCurrentMonth: boolean
  onPress: () => void
}

export function DayCell({
  dayKey,
  appointments,
  isSelected,
  isToday,
  isCurrentMonth,
  onPress,
}: DayCellProps) {
  const dayNumber = dayjs(dayKey).date()
  const visibleDots = isCurrentMonth ? appointments.slice(0, 3) : []
  const overflow = isCurrentMonth && appointments.length > 3 ? appointments.length - 3 : 0

  return (
    <Pressable
      onPress={onPress}
      className="flex-1 aspect-square items-center justify-center py-1"
    >
      {/* Day number badge */}
      <View
        className={`w-7 h-7 rounded-full items-center justify-center ${
          isSelected
            ? 'bg-primary-600'
            : isToday && isCurrentMonth
            ? 'border border-primary-600'
            : ''
        }`}
      >
        <Text
          className={`text-xs ${
            isSelected
              ? 'text-white font-bold'
              : isToday && isCurrentMonth
              ? 'text-primary-600 font-bold'
              : isCurrentMonth
              ? 'text-neutral-800'
              : 'text-neutral-300'
          }`}
        >
          {dayNumber}
        </Text>
      </View>

      {/* Status dots row */}
      {visibleDots.length > 0 && (
        <View className="flex-row gap-0.5 mt-0.5">
          {visibleDots.map((a, i) => (
            <View
              key={i}
              style={{ backgroundColor: STATUS_COLORS[a.status] }}
              className="w-1.5 h-1.5 rounded-full"
            />
          ))}
          {overflow > 0 && (
            <Text className="text-neutral-400 text-[8px] leading-[6px]">
              +{overflow}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  )
}
