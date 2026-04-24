import React from 'react'
import { Pressable, Text, ActivityIndicator, PressableProps } from 'react-native'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends PressableProps {
  label: string
  variant?: Variant
  isLoading?: boolean
  fullWidth?: boolean
  className?: string
}

const variantClasses: Record<Variant, { container: string; text: string }> = {
  primary: { container: 'bg-primary-600 rounded-xl py-3 px-5', text: 'text-white font-semibold text-base' },
  secondary: { container: 'bg-neutral-100 rounded-xl py-3 px-5 border border-neutral-200', text: 'text-neutral-700 font-semibold text-base' },
  danger: { container: 'bg-red-600 rounded-xl py-3 px-5', text: 'text-white font-semibold text-base' },
  ghost: { container: 'py-3 px-5', text: 'text-primary-600 font-semibold text-base' },
}

export function Button({ label, variant = 'primary', isLoading, fullWidth, disabled, className, ...rest }: ButtonProps) {
  const { container, text } = variantClasses[variant]
  const isDisabled = disabled || isLoading

  return (
    <Pressable
      className={`${container} items-center justify-center ${fullWidth ? 'w-full' : ''} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      disabled={isDisabled}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : '#2563EB'} />
      ) : (
        <Text className={text}>{label}</Text>
      )}
    </Pressable>
  )
}
