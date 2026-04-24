import React from 'react'
import { ScrollView } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { CreateClientDTO } from '@/domain/entities/client'

interface FormValues {
  name: string
  phone: string
  email: string
  notes: string
}

interface ClientFormProps {
  defaultValues?: Partial<FormValues>
  onSubmit: (data: Omit<CreateClientDTO, 'userId'>) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

export function ClientForm({ defaultValues, onSubmit, isLoading, submitLabel = 'Guardar' }: ClientFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: defaultValues ?? {},
  })

  const handleFormSubmit = async (values: FormValues) => {
    await onSubmit({
      name: values.name,
      phone: values.phone,
      email: values.email || undefined,
      notes: values.notes || undefined,
    })
  }

  return (
    <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
      <Controller
        control={control}
        name="name"
        rules={{ required: 'El nombre es obligatorio' }}
        render={({ field: { onChange, value } }) => (
          <Input
            label="Nombre completo"
            placeholder="Juan Pérez"
            value={value}
            onChangeText={onChange}
            autoCapitalize="words"
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="phone"
        rules={{ required: 'El teléfono es obligatorio' }}
        render={({ field: { onChange, value } }) => (
          <Input
            label="Teléfono"
            placeholder="912345678"
            value={value}
            onChangeText={onChange}
            keyboardType="phone-pad"
            error={errors.phone?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Email (opcional)"
            placeholder="juan@ejemplo.com"
            value={value}
            onChangeText={onChange}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />

      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Notas (opcional)"
            placeholder="Información adicional..."
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
