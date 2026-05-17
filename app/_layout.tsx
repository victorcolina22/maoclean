import "../global.css";
import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "@/stores/useAuthStore";
import { onAuthChange } from "@/services/authService";
import { requestNotificationPermission } from "@/services/notificationService";

export default function RootLayout() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    requestNotificationPermission();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, isLoading, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="appointment"
          options={{ headerShown: true, title: "Cita" }}
        />
        <Stack.Screen name="clientes" options={{ headerShown: true, title: "Clientes" }} />
        <Stack.Screen name="metricas" options={{ headerShown: true, title: "Métricas" }} />
        <Stack.Screen name="notificaciones" options={{ headerShown: true, title: "Notificaciones" }} />
        <Stack.Screen name="ajustes" options={{ headerShown: true, title: "Ajustes" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
