import "../global.css";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "@/stores/useAuthStore";
import { onAuthChange, autoLogin } from "@/services/authService";
import { requestNotificationPermission } from "@/services/notificationService";
// TODO(cleanup): part of the one-time reminder resync migration — see
// services/notificationMigration.ts for removal notes.
import { resyncRemindersOnce } from "@/services/notificationMigration";

export default function RootLayout() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) resyncRemindersOnce(firebaseUser.uid);
    });
    autoLogin();
    requestNotificationPermission();
    return unsubscribe;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="appointment"
          options={{ headerShown: true, title: "Cita" }}
        />
        <Stack.Screen name="clientes" options={{ headerShown: false }} />
        <Stack.Screen name="metricas" options={{ headerShown: false }} />
        <Stack.Screen
          name="notificaciones"
          options={{ headerShown: true, title: "Notificaciones" }}
        />
        <Stack.Screen
          name="ajustes"
          options={{ headerShown: true, title: "Ajustes" }}
        />
        <Stack.Screen
          name="ajustes/zonas"
          options={{ headerShown: true, title: "Zonas" }}
        />
        <Stack.Screen name="filter" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
