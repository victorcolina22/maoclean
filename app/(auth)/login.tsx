import React, { useState } from 'react'
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { login } from '@/services/authService'

interface FormValues {
  email: string
  password: string
}

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' })

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>()

  const handleLogin = async (values: FormValues) => {
    setIsLoading(true)
    const result = await login(values.email, values.password)
    setIsLoading(false)

    if (!result.success) {
      setToast({ visible: true, message: result.error })
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-10">
          <Text className="text-3xl font-bold text-neutral-900">MaoClean</Text>
          <Text className="text-base text-neutral-500 mt-1">Gestión de citas de limpieza</Text>
        </View>

        <View className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
          <Text className="text-xl font-semibold text-neutral-900 mb-6">Iniciar sesión</Text>

          <Controller
            control={control}
            name="email"
            rules={{
              required: 'El correo es obligatorio',
              pattern: { value: /\S+@\S+\.\S+/, message: 'Correo inválido' },
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Correo electrónico"
                placeholder="correo@ejemplo.com"
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{ required: 'La contraseña es obligatoria' }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Contraseña"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                error={errors.password?.message}
              />
            )}
          />

          <Button
            label="Entrar"
            onPress={handleSubmit(handleLogin)}
            isLoading={isLoading}
            fullWidth
            className="mt-2"
          />
        </View>
      </ScrollView>

      <Toast
        message={toast.message}
        type="error"
        visible={toast.visible}
        onHide={() => setToast({ visible: false, message: '' })}
      />
    </KeyboardAvoidingView>
  )
}
