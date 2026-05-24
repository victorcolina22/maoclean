import React from 'react'
import { Tabs } from 'expo-router'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import NavigationDrawer from '@/components/ui/NavigationDrawer'

const ACTIVE_COLOR = '#2563EB'
const INACTIVE_COLOR = '#9CA3AF'

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: ACTIVE_COLOR,
          tabBarInactiveTintColor: INACTIVE_COLOR,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E5E7EB',
            height: 60,
            paddingBottom: 8,
          },
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '600', color: '#111827' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Hoy',
            tabBarIcon: ({ focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} />
            ),
          }}
        />
        <Tabs.Screen
          name="citas"
          options={{
            title: 'Citas',
            tabBarIcon: ({ focused }) => (
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} />
            ),
          }}
        />
        <Tabs.Screen
          name="mapa"
          options={{
            title: 'Mapa',
            tabBarIcon: ({ focused }) => (
              <Ionicons name={focused ? 'map' : 'map-outline'} size={24} color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} />
            ),
          }}
        />
      </Tabs>
      <NavigationDrawer />
    </View>
  )
}
