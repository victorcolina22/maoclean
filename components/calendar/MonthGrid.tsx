import '@/utils/dateUtils'           // side-effect: registers dayjs utc + timezone plugins
import React from 'react'
import { View, Text, Pressable } from 'react-native'
import dayjs from 'dayjs'
import { Appointment } from '@/domain/entities/appointment'
import { DayCell } from '@/components/calendar/DayCell'
import { WEEKDAY_LABELS, TZ } from '@/constants/calendar'

interface MonthGridProps {
  visibleMonth: dayjs.Dayjs
  selectedDateKey: string
  dayMap: Map<string, Appointment[]>
  onDayPress: (date: Date) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

export function MonthGrid({
  visibleMonth,
  selectedDateKey,
  dayMap,
  onDayPress,
  onPrevMonth,
  onNextMonth,
}: MonthGridProps) {
  const todayKey = dayjs().tz(TZ).format('YYYY-MM-DD')
  const monthStart = visibleMonth.startOf('month')
  const gridStart = monthStart.subtract(monthStart.day(), 'day')

  // Build 42 cells (6 rows × 7 cols)
  const cells: dayjs.Dayjs[] = []
  for (let i = 0; i < 42; i++) {
    cells.push(gridStart.add(i, 'day'))
  }

  const monthLabel =
    visibleMonth.locale('es').format('MMMM YYYY').charAt(0).toUpperCase() +
    visibleMonth.locale('es').format('MMMM YYYY').slice(1)

  return (
    <View className="flex-1 px-4">
      {/* Month navigation strip */}
      <View className="flex-row items-center justify-between py-3">
        <Pressable onPress={onPrevMonth} className="p-2">
          <Text className="text-neutral-600 text-lg">‹</Text>
        </Pressable>
        <Text className="text-neutral-800 font-semibold text-base">{monthLabel}</Text>
        <Pressable onPress={onNextMonth} className="p-2">
          <Text className="text-neutral-600 text-lg">›</Text>
        </Pressable>
      </View>

      {/* Weekday header */}
      <View className="flex-row mb-1">
        {WEEKDAY_LABELS.map((label, index) => (
          <View key={index} className="flex-1 items-center">
            <Text className="text-neutral-400 text-xs font-medium">{label}</Text>
          </View>
        ))}
      </View>

      {/* 42-cell grid (6 rows) */}
      {Array.from({ length: 6 }).map((_, rowIndex) => (
        <View key={rowIndex} className="flex-row">
          {cells.slice(rowIndex * 7, rowIndex * 7 + 7).map((cell) => {
            const key = cell.format('YYYY-MM-DD')
            const isCurrentMonth = cell.month() === visibleMonth.month()
            const appointments = isCurrentMonth ? (dayMap.get(key) ?? []) : []
            return (
              <DayCell
                key={key}
                dayKey={key}
                appointments={appointments}
                isSelected={key === selectedDateKey}
                isToday={key === todayKey}
                isCurrentMonth={isCurrentMonth}
                onPress={() => onDayPress(cell.toDate())}
              />
            )
          })}
        </View>
      ))}

      {/* Empty state — additive, below grid */}
      {dayMap.size === 0 && (
        <View className="items-center py-4">
          <Text className="text-neutral-400 text-sm">Sin citas este mes</Text>
        </View>
      )}
    </View>
  )
}
