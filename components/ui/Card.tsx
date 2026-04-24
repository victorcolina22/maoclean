import React from 'react'
import { View, ViewProps } from 'react-native'

interface CardProps extends ViewProps {
  children: React.ReactNode
}

export function Card({ children, className, ...rest }: CardProps) {
  return (
    <View
      className={`bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 ${className ?? ''}`}
      {...rest}
    >
      {children}
    </View>
  )
}
