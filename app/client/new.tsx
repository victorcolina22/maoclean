import React, { useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { ClientForm } from '@/components/clients/ClientForm'
import { Toast } from '@/components/ui/Toast'
import { useClients } from '@/hooks/useClients'
import { CreateClientDTO } from '@/domain/entities/client'

export default function NewClientScreen() {
  const router = useRouter()
  const { create } = useClients()
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  })

  const handleSubmit = async (data: Omit<CreateClientDTO, 'userId'>) => {
    setIsLoading(true)
    const result = await create(data)
    setIsLoading(false)

    if (result.success) {
      setToast({ visible: true, message: 'Cliente creado correctamente', type: 'success' })
      setTimeout(() => router.back(), 1500)
    } else {
      setToast({ visible: true, message: result.error, type: 'error' })
    }
  }

  return (
    <View className="flex-1 bg-neutral-50 pt-4">
      <ClientForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Crear cliente"
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
