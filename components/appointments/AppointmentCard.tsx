import React from 'react'
import { Pressable, View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { Appointment } from '@/domain/entities/appointment'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from './StatusBadge'
import { PaymentBadge } from './PaymentBadge'
import { formatTime, formatDuration, computeDeliveryStatus } from '@/utils/dateUtils'
import { DeliveryStatusBadge } from './DeliveryStatusBadge'
import { formatCLP } from '@/utils/formatUtils'
import { SERVICE_LABELS } from '@/constants/services'

interface AppointmentCardProps {
  appointment: Appointment
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const router = useRouter()
  const deliveryStatus = computeDeliveryStatus(appointment.deliveryDate, appointment.status)

  return (
    <Pressable onPress={() => router.push(`/appointment/${appointment.id}`)}>
      <Card className="mb-3">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-base font-semibold text-neutral-900">
              {appointment.clientName}
            </Text>
            <Text className="text-sm text-neutral-500">
              {SERVICE_LABELS[appointment.serviceType]}
            </Text>
          </View>
          <Text className="text-base font-bold text-neutral-900">
            {formatTime(appointment.scheduledAt)}
          </Text>
        </View>

        <Text className="text-sm text-neutral-600 mb-3" numberOfLines={1}>
          📍 {appointment.location.address}
        </Text>

        <View className="flex-row justify-between items-center">
          <View className="flex-row gap-2">
            <StatusBadge status={appointment.status} />
            <PaymentBadge status={appointment.paymentStatus} />
            {(deliveryStatus === 'soon' || deliveryStatus === 'late') && (
              <DeliveryStatusBadge status={deliveryStatus} />
            )}
          </View>
          <View className="items-end">
            <Text className="text-sm font-semibold text-neutral-800">
              {formatCLP(appointment.price)}
            </Text>
            <Text className="text-xs text-neutral-400">
              {formatDuration(appointment.estimatedDuration)}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  )
}
