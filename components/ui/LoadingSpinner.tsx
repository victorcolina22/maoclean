import React from 'react'
import { View, ActivityIndicator } from 'react-native'

interface LoadingSpinnerProps {
  fullScreen?: boolean
}

export function LoadingSpinner({ fullScreen }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    )
  }
  return <ActivityIndicator size="small" color="#2563EB" />
}
