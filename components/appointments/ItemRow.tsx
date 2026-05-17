import React from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { Controller, Control, FieldErrors, useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { ServiceType } from '@/domain/entities/appointment'
import { SERVICE_LIST, SERVICE_LABELS } from '@/constants/services'

interface ItemRowProps {
  index: number
  control: Control<any>
  errors: FieldErrors<any>
  onRemove: () => void
  isOnly: boolean
  watchType: ServiceType
}

export default function ItemRow({ index, control, errors, onRemove, isOnly, watchType }: ItemRowProps) {
  const { setValue } = useFormContext()
  const itemErrors = (errors?.items as any)?.[index]

  return (
    <View className="mb-4 p-3 bg-white rounded-2xl border border-neutral-200">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-sm font-semibold text-neutral-700">Servicio {index + 1}</Text>
        <Pressable
          onPress={onRemove}
          disabled={isOnly}
          className={`w-7 h-7 rounded-full items-center justify-center ${isOnly ? 'bg-neutral-100' : 'bg-red-100'}`}
        >
          <Text className={`text-sm font-bold ${isOnly ? 'text-neutral-300' : 'text-red-600'}`}>✕</Text>
        </Pressable>
      </View>

      <Controller
        control={control}
        name={`items.${index}.type`}
        render={({ field: { onChange, value } }) => (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <View className="flex-row gap-2">
              {SERVICE_LIST.map((s) => (
                <Pressable
                  key={s.value}
                  onPress={() => {
                    onChange(s.value)
                    if (s.value === 'otro') {
                      setValue(`items.${index}.label`, '')
                    } else {
                      setValue(`items.${index}.label`, SERVICE_LABELS[s.value])
                    }
                  }}
                  className={`px-3 py-2 rounded-xl border ${
                    value === s.value
                      ? 'bg-primary-600 border-primary-600'
                      : 'bg-white border-neutral-200'
                  }`}
                >
                  <Text
                    className={
                      value === s.value
                        ? 'text-white text-sm font-medium'
                        : 'text-neutral-700 text-sm'
                    }
                  >
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
      />

      {watchType === 'otro' && (
        <Controller
          control={control}
          name={`items.${index}.label`}
          rules={{
            validate: (v: string) =>
              (typeof v === 'string' && v.trim().length > 0) || 'Ingresa el nombre del servicio',
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              label="Nombre del servicio"
              placeholder="Descripción del servicio"
              value={value}
              onChangeText={onChange}
              error={itemErrors?.label?.message}
            />
          )}
        />
      )}

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={control}
            name={`items.${index}.qty`}
            rules={{
              required: 'Cantidad requerida',
              validate: (v: string) =>
                parseInt(v, 10) >= 1 || 'Cantidad inválida',
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Cantidad"
                placeholder="1"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                error={itemErrors?.qty?.message}
              />
            )}
          />
        </View>
        <View className="flex-1">
          <Controller
            control={control}
            name={`items.${index}.unitPrice`}
            rules={{
              required: 'Precio requerido',
              validate: (v: string) =>
                parseInt(v, 10) >= 0 || 'Precio inválido',
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Precio unit. CLP"
                placeholder="30000"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                error={itemErrors?.unitPrice?.message}
              />
            )}
          />
        </View>
      </View>
    </View>
  )
}
