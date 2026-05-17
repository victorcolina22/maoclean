import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Appointment } from '@/domain/entities/appointment'
import { STATUS_COLORS } from '@/constants/calendar'
import { summarizeItems } from '@/constants/services'

interface TimeBlockProps {
  appointment: Appointment
  top: number
  height: number
  left: number
  right: number
  zIndex: number
}

export function TimeBlock({ appointment, top, height, left, right, zIndex }: TimeBlockProps) {
  const router = useRouter()

  return (
    <Pressable
      onPress={() => router.push(`/appointment/${appointment.id}`)}
      style={{
        position: 'absolute',
        top,
        height,
        left,
        right,
        zIndex,
        backgroundColor: STATUS_COLORS[appointment.status],
        opacity: 0.9,
        borderRadius: 6,
        padding: 4,
        overflow: 'hidden',
      }}
    >
      <Text className="text-white font-bold text-xs" numberOfLines={1}>
        {appointment.clientName}
      </Text>
      {height >= 40 && (
        <Text className="text-white text-xs opacity-80" numberOfLines={1}>
          {summarizeItems(appointment.items)}
        </Text>
      )}
    </Pressable>
  )
}
