import React, { useEffect, useRef } from 'react'
import { Animated, Text, View } from 'react-native'

type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  visible: boolean
  onHide: () => void
}

const typeClasses: Record<ToastType, string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-neutral-800',
}

export function Toast({ message, type = 'info', visible, onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => onHide())
    }
  }, [visible])

  if (!visible) return null

  return (
    <Animated.View
      style={{ opacity }}
      className={`absolute bottom-10 left-6 right-6 ${typeClasses[type]} rounded-xl px-4 py-3 z-50`}
    >
      <Text className="text-white text-sm font-medium text-center">{message}</Text>
    </Animated.View>
  )
}
