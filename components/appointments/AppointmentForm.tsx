import React from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { Timestamp, GeoPoint } from 'firebase/firestore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { DateTimePickerField } from '@/components/ui/DateTimePickerField'
import { CreateAppointmentDTO, ServiceType, AppointmentStatus, PaymentStatus } from '@/domain/entities/appointment'
import { SERVICE_LIST } from '@/constants/services'
import { SANTIAGO_COMMUNES } from '@/constants/communes'
import { parseScheduledAt } from '@/utils/dateUtils'

interface FormValues {
  clientName: string
  clientPhone: string
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
      clientName: values.clientName,
      clientPhone: values.clientPhone || undefined,
      serviceType: values.serviceType,
      location: {
        address: values.address,
        coordinates: new GeoPoint(0, 0),
        commune: values.commune,
      },
      scheduledAt: Timestamp.fromDate(parseScheduledAt(values.scheduledAt).toDate()),
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
        name="clientName"
        rules={{ required: 'Ingresa el nombre del cliente' }}
        render={({ field: { onChange, value } }) => (
          <Input
            label="Nombre del cliente"
            placeholder="Nombre del cliente"
            value={value}
            onChangeText={onChange}
            error={errors.clientName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="clientPhone"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Teléfono"
            placeholder="+56 9 1234 5678"
            value={value}
            onChangeText={onChange}
            keyboardType="phone-pad"
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
        rules={{
          required: 'Selecciona fecha y hora',
          validate: (v) => parseScheduledAt(v).isValid() || 'Fecha inválida',
        }}
        render={({ field: { onChange, value } }) => (
          <DateTimePickerField
            label="Fecha y hora"
            value={value ?? ''}
            onChange={onChange}
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
