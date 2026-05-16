import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { appointmentRepository } from '@/services/appointmentRepository'
import { Appointment } from '@/domain/entities/appointment'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/appointments/StatusBadge'
import { PaymentBadge } from '@/components/appointments/PaymentBadge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { useAppointments } from '@/hooks/useAppointments'
import { formatDate, formatTime, formatDuration, toSantiago, computeDeliveryStatus } from '@/utils/dateUtils'
import { DeliveryStatusBadge } from '@/components/appointments/DeliveryStatusBadge'
import { formatCLP, formatPhone } from '@/utils/formatUtils'
import { SERVICE_LABELS } from '@/constants/services'

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { remove } = useAppointments()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    appointmentRepository.getById(id).then((result) => {
      if (result.success) setAppointment(result.data)
      setIsLoading(false)
    })
  }, [id])

  const handleDelete = () => {
    Alert.alert(
      'Eliminar cita',
      '¿Estás seguro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!id) return
            await remove(id)
            router.back()
          },
        },
      ]
    )
  }

  if (isLoading) return <LoadingSpinner fullScreen />
  if (!appointment) return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-neutral-500">Cita no encontrada.</Text>
    </View>
  )

  return (
    <ScrollView className="flex-1 bg-neutral-50 px-4 pt-4">
      <Card className="mb-4">
        <View className="flex-row justify-between items-start mb-4">
          <View>
            <Text className="text-xl font-bold text-neutral-900">
              {appointment.clientName}
            </Text>
            <Text className="text-sm text-neutral-500">
              {appointment.clientPhone ? formatPhone(appointment.clientPhone) : ''}
            </Text>
          </View>
          <StatusBadge status={appointment.status} />
        </View>

        <View className="gap-3">
          <Row label="Servicio" value={SERVICE_LABELS[appointment.serviceType]} />
          <Row label="Fecha" value={formatDate(appointment.scheduledAt)} />
          <Row label="Hora" value={formatTime(appointment.scheduledAt)} />
          {appointment.deliveryDate && (
            <View className="flex-row items-center justify-between py-2 border-b border-neutral-100">
              <Text className="text-sm text-neutral-500">Entrega</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-medium text-neutral-800">
                  {toSantiago(appointment.deliveryDate).format('DD/MM/YYYY HH:mm')}
                </Text>
                <DeliveryStatusBadge
                  status={computeDeliveryStatus(appointment.deliveryDate, appointment.status)}
                />
              </View>
            </View>
          )}
          <Row label="Duración" value={formatDuration(appointment.estimatedDuration)} />
          <Row label="Dirección" value={appointment.location.address} />
          <Row label="Comuna" value={appointment.location.commune} />
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-neutral-500">Precio</Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-base font-semibold text-neutral-900">
                {formatCLP(appointment.price)}
              </Text>
              <PaymentBadge status={appointment.paymentStatus} />
            </View>
          </View>
          {appointment.notes && <Row label="Notas" value={appointment.notes} />}
        </View>
      </Card>

      <View className="gap-3 mb-8">
        <Button
          label="Editar cita"
          variant="secondary"
          onPress={() => router.push(`/appointment/edit/${id}`)}
          fullWidth
        />
        <Button
          label="Eliminar cita"
          variant="danger"
          onPress={handleDelete}
          fullWidth
        />
      </View>
    </ScrollView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-neutral-500">{label}</Text>
      <Text className="text-sm text-neutral-800 font-medium text-right flex-1 ml-4">{value}</Text>
    </View>
  )
}
