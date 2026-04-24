import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import Constants from 'expo-constants'

const isExpoGo = Constants.appOwnership === 'expo'

// Defer import to avoid TurboModule crash in Expo Go (RNMapsAirModule not bundled)
const RNMapView = isExpoGo ? null : (require('react-native-maps').default as any)

const SANTIAGO_CENTER = {
  latitude: -33.45,
  longitude: -70.667,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
}

interface AppMapViewProps {
  children?: React.ReactNode
}

export function AppMapView({ children }: AppMapViewProps) {
  if (isExpoGo || !RNMapView) {
    return (
      <View style={StyleSheet.absoluteFill} className="items-center justify-center bg-neutral-100">
        <Text className="text-neutral-500 text-sm text-center px-6">
          El mapa no está disponible en Expo Go.{'\n'}Usa un development build.
        </Text>
      </View>
    )
  }

  return (
    <RNMapView
      style={StyleSheet.absoluteFill}
      initialRegion={SANTIAGO_CENTER}
      showsUserLocation
      showsMyLocationButton
    >
      {children}
    </RNMapView>
  )
}
