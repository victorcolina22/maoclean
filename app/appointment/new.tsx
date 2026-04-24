import React, { useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { AppointmentForm } from '@/components/appointments/AppointmentForm'
import { Toast } from '@/components/ui/Toast'
import { useAppointments } from '@/hooks/useAppointments'
import { CreateAppointmentDTO } from '@/domain/entities/appointment'

export default function NewAppointmentScreen() {
  const router = useRouter()
  const { create } = useAppointments()
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  })

  const handleSubmit = async (data: Omit<CreateAppointmentDTO, 'userId'>) => {
    setIsLoading(true)
    const result = await create(data)
    setIsLoading(false)

    if (result.success) {
      setToast({ visible: true, message: 'Cita creada correctamente', type: 'success' })
      setTimeout(() => router.back(), 1500)
    } else {
      setToast({ visible: true, message: result.error, type: 'error' })
    }
  }

  return (
    <View className="flex-1 bg-neutral-50 pt-4">
      <AppointmentForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Crear cita"
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
