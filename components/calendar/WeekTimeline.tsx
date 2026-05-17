import '@/utils/dateUtils'           // side-effect: registers dayjs utc + timezone plugins
import React, { useEffect, useRef } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import dayjs from 'dayjs'
import { useAppointments } from '@/hooks/useAppointments'
import { useAppointmentsStore } from '@/stores/useAppointmentsStore'
import { TimeBlock } from '@/components/calendar/TimeBlock'
import {
  TZ,
  HOUR_START,
  HOUR_END,
  PX_PER_MIN,
  MIN_BLOCK_MINUTES,
  TOTAL_HEIGHT,
} from '@/constants/calendar'
import { Appointment } from '@/domain/entities/appointment'

interface LayoutBlock {
  appointment: Appointment
  top: number
  height: number
  left: number
  right: number
  zIndex: number
}

function computeLayout(appointments: Appointment[]): LayoutBlock[] {
  // 1. Sort by scheduledAt.seconds ascending
  const sorted = [...appointments].sort(
    (a, b) => a.scheduledAt.seconds - b.scheduledAt.seconds,
  )

  let clusterEnd = 0
  let stackIndex = 0

  return sorted.map((a) => {
    const blockMins = Math.max(a.estimatedDuration, MIN_BLOCK_MINUTES)
    const endSec = a.scheduledAt.seconds + blockMins * 60

    if (a.scheduledAt.seconds < clusterEnd) {
      // Same cluster
      stackIndex += 1
    } else {
      // New cluster
      stackIndex = 0
    }
    clusterEnd = Math.max(clusterEnd, endSec)

    const start = dayjs(a.scheduledAt.toDate()).tz(TZ)
    const minsFrom = (start.hour() - HOUR_START) * 60 + start.minute()
    const top = minsFrom * PX_PER_MIN
    const height = blockMins * PX_PER_MIN

    return {
      appointment: a,
      top,
      height,
      left: stackIndex * 12,
      right: 8,
      zIndex: stackIndex,
    }
  })
}

export function WeekTimeline() {
  const { appointments, isLoading } = useAppointments()
  const { selectedDate, setSelectedDate } = useAppointmentsStore()
  const scrollViewRef = useRef<ScrollView>(null)

  // Auto-scroll to current hour on mount only
  useEffect(() => {
    const currentHour = dayjs().tz(TZ).hour()
    const y = Math.max(0, (currentHour - HOUR_START - 1) * 60 * PX_PER_MIN)
    scrollViewRef.current?.scrollTo({ y, animated: false })
  }, [])

  const dayLabel =
    dayjs(selectedDate).tz(TZ).locale('es').format('dddd D [de] MMMM').charAt(0).toUpperCase() +
    dayjs(selectedDate).tz(TZ).locale('es').format('dddd D [de] MMMM').slice(1)

  const layout = computeLayout(appointments)

  const hourLabels: number[] = []
  for (let h = HOUR_START; h <= HOUR_END; h++) {
    hourLabels.push(h)
  }

  return (
    <View className="flex-1">
      {/* Day navigation header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-100">
        <Pressable
          onPress={() =>
            setSelectedDate(dayjs(selectedDate).tz(TZ).subtract(1, 'day').toDate())
          }
          className="p-2"
        >
          <Text className="text-neutral-600 text-lg">‹</Text>
        </Pressable>
        <Text className="text-neutral-800 font-semibold text-sm">{dayLabel}</Text>
        <Pressable
          onPress={() =>
            setSelectedDate(dayjs(selectedDate).tz(TZ).add(1, 'day').toDate())
          }
          className="p-2"
        >
          <Text className="text-neutral-600 text-lg">›</Text>
        </Pressable>
      </View>

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>
        {/* Timeline container */}
        <View style={{ position: 'relative', height: TOTAL_HEIGHT }}>
          {/* Hour labels and grid lines */}
          {hourLabels.map((hour) => {
            const top = (hour - HOUR_START) * 60 * PX_PER_MIN
            return (
              <View
                key={hour}
                style={{ position: 'absolute', top, left: 0, right: 0 }}
                className="flex-row items-center border-b border-neutral-100"
              >
                <View style={{ width: 48 }}>
                  <Text className="text-neutral-400 text-xs px-2">
                    {String(hour).padStart(2, '0')}:00
                  </Text>
                </View>
              </View>
            )
          })}

          {/* Appointment blocks */}
          {layout.map((block) => (
            <TimeBlock
              key={block.appointment.id}
              appointment={block.appointment}
              top={block.top}
              height={block.height}
              left={block.left + 48}
              right={block.right}
              zIndex={block.zIndex}
            />
          ))}

          {/* Empty state overlay */}
          {appointments.length === 0 && !isLoading && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 48,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text className="text-neutral-400 text-sm">Sin citas para este día</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
