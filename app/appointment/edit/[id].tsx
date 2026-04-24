import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { appointmentRepository } from '@/services/appointmentRepository'
import { AppointmentForm } from '@/components/appointments/AppointmentForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Toast } from '@/components/ui/Toast'
import { useAppointments } from '@/hooks/useAppointments'
import { Appointment, CreateAppointmentDTO } from '@/domain/entities/appointment'
import { toSantiago } from '@/utils/dateUtils'

export default function EditAppointmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { update } = useAppointments()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  })

  useEffect(() => {
    if (!id) return
    appointmentRepository.getById(id).then((result) => {
      if (result.success) setAppointment(result.data)
      setIsFetching(false)
    })
  }, [id])

  const handleSubmit = async (data: Omit<CreateAppointmentDTO, 'userId'>) => {
    if (!id) return
    setIsLoading(true)
    const result = await update(id, data)
    setIsLoading(false)

    if (result.success) {
      setToast({ visible: true, message: 'Cita actualizada', type: 'success' })
      setTimeout(() => router.back(), 1500)
    } else {
      setToast({ visible: true, message: result.error, type: 'error' })
    }
  }

  if (isFetching) return <LoadingSpinner fullScreen />

  const defaultValues = appointment
    ? {
        clientId: appointment.clientId,
        serviceType: appointment.serviceType,
        address: appointment.location.address,
        commune: appointment.location.commune,
        scheduledAt: toSantiago(appointment.scheduledAt).format('YYYY-MM-DDTHH:mm'),
        estimatedDuration: String(appointment.estimatedDuration),
        price: String(appointment.price),
        paymentStatus: appointment.paymentStatus,
        status: appointment.status,
        notes: appointment.notes ?? '',
      }
    : undefined

  return (
    <View className="flex-1 bg-neutral-50 pt-4">
      <AppointmentForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Actualizar cita"
      />
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
      />
    </View>
  )
}
