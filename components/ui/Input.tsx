import React from 'react'
import { View, Text, TextInput, TextInputProps } from 'react-native'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export function Input({ label, error, ...rest }: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-neutral-700 mb-1">{label}</Text>
      )}
      <TextInput
        className={`bg-white border rounded-xl px-4 py-3 text-base text-neutral-900 ${
          error ? 'border-red-500' : 'border-neutral-200'
        }`}
        placeholderTextColor="#9CA3AF"
        {...rest}
      />
      {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
    </View>
  )
}
