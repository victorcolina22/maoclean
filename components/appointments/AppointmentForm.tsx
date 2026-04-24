import React from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { Timestamp, GeoPoint } from 'firebase/firestore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { CreateAppointmentDTO, ServiceType, AppointmentStatus, PaymentStatus } from '@/domain/entities/appointment'
import { SERVICE_LIST } from '@/constants/services'
import { SANTIAGO_COMMUNES } from '@/constants/communes'

interface FormValues {
  clientId: string
  serviceType: ServiceType
  address: string
  commune: string
  scheduledAt: string
  estimatedDuration: string
  price: string
  paymentStatus: PaymentStatus
  status: AppointmentStatus
  notes: string
}

interface AppointmentFormProps {
  defaultValues?: Partial<FormValues>
  onSubmit: (data: Omit<CreateAppointmentDTO, 'userId'>) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

export function AppointmentForm({ defaultValues, onSubmit, isLoading, submitLabel = 'Guardar' }: AppointmentFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      serviceType: 'casa',
      paymentStatus: 'pending',
      status: 'scheduled',
      estimatedDuration: '60',
      commune: 'Santiago',
      ...defaultValues,
    },
  })

  const handleFormSubmit = async (values: FormValues) => {
    const dto: Omit<CreateAppointmentDTO, 'userId'> = {
      clientId: values.clientId,
      serviceType: values.serviceType,
      location: {
        address: values.address,
        coordinates: new GeoPoint(0, 0),
        commune: values.commune,
      },
      scheduledAt: Timestamp.fromDate(new Date(values.scheduledAt)),
      estimatedDuration: parseInt(values.estimatedDuration, 10),
      price: parseInt(values.price, 10),
      paymentStatus: values.paymentStatus,
      status: values.status,
      notes: values.notes || undefined,
    }
    await onSubmit(dto)
  }

  return (
    <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
      <Controller
        control={control}
        name="clientId"
        rules={{ required: 'Selecciona un cliente' }}
        render={({ field: { onChange, value } }) => (
          <Input
            label="ID del cliente"
            placeholder="ID del cliente"
            value={value}
            onChangeText={onChange}
            error={errors.clientId?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="serviceType"
        render={({ field: { onChange, value } }) => (
          <View className="mb-4">
            <Text className="text-sm font-medium text-neutral-700 mb-2">Tipo de servicio</Text>
            <View className="flex-row flex-wrap gap-2">
              {SERVICE_LIST.map((s) => (
                <Pressable
                  key={s.value}
                  onPress={() => onChange(s.value)}
                  className={`px-3 py-2 rounded-xl border ${
                    value === s.value
                      ? 'bg-primary-600 border-primary-600'
                      : 'bg-white border-neutral-200'
                  }`}
                >
                  <Text className={value === s.value ? 'text-white text-sm font-medium' : 'text-neutral-700 text-sm'}>
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      />

      <Controller
        control={control}
        name="address"
        rules={{ required: 'Ingresa la dirección' }}
        render={({ field: { onChange, value } }) => (
          <Input
            label="Dirección"
            placeholder="Av. Providencia 1234"
            value={value}
            onChangeText={onChange}
            error={errors.address?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="scheduledAt"
        rules={{ required: 'Ingresa fecha y hora' }}
        render={({ field: { onChange, value } }) => (
          <Input
            label="Fecha y hora (YYYY-MM-DDTHH:mm)"
            placeholder="2025-06-15T10:00"
            value={value}
            onChangeText={onChange}
            error={errors.scheduledAt?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="estimatedDuration"
        rules={{ required: 'Ingresa la duración' }}
        render={({ field: { onChange, value } }) => (
          <Input
            label="Duración (minutos)"
            placeholder="60"
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
            error={errors.estimatedDuration?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="price"
        rules={{ required: 'Ingresa el precio' }}
        render={({ field: { onChange, value } }) => (
          <Input
            label="Precio (CLP)"
            placeholder="30000"
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
            error={errors.price?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Notas (opcional)"
            placeholder="Instrucciones especiales..."
            value={value}
            onChangeText={onChange}
            multiline
            numberOfLines={3}
          />
        )}
      />

      <Button
        label={submitLabel}
        onPress={handleSubmit(handleFormSubmit)}
        isLoading={isLoading}
        fullWidth
        className="mt-4 mb-8"
      />
    </ScrollView>
  )
}
