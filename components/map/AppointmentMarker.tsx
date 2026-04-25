import React from 'react'
import { View, Text } from 'react-native'
import Constants from 'expo-constants'
import { Appointment } from '@/domain/entities/appointment'
import { SERVICE_LABELS } from '@/constants/services'
import { formatTime } from '@/utils/dateUtils'

const isExpoGo = Constants.appOwnership === 'expo'

// Defer import to avoid TurboModule crash in Expo Go (RNMapsAirModule not bundled)
const Marker = isExpoGo ? null : (require('react-native-maps').Marker as any)

interface AppointmentMarkerProps {
  appointment: Appointment
  onPress?: () => void
}

export function AppointmentMarker({ appointment, onPress }: AppointmentMarkerProps) {
  if (isExpoGo || !Marker) return null

  const { latitude, longitude } = appointment.location.coordinates

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      title={appointment.clientName}
      description={`${SERVICE_LABELS[appointment.serviceType]} · ${formatTime(appointment.scheduledAt)}`}
      onPress={onPress}
    >
      <View className="bg-primary-600 rounded-full w-8 h-8 items-center justify-center border-2 border-white shadow">
        <Text className="text-white text-xs font-bold">
          {formatTime(appointment.scheduledAt).slice(0, 2)}
        </Text>
      </View>
    </Marker>
  )
}
