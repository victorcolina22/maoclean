import "../global.css";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRoleStore } from "@/stores/useRoleStore";
import { onAuthChange } from "@/services/authService";
import { requestNotificationPermission } from "@/services/notificationService";
// TODO(cleanup): part of the one-time reminder resync migration — see
// services/notificationMigration.ts for removal notes.
import { resyncRemindersOnce } from "@/services/notificationMigration";
// TODO(cleanup): part of the one-time org/roles data migration — see
// services/dataModelMigration.ts for removal notes.
import { migrateOwnerAndPricingOnce } from "@/services/dataModelMigration";
import type { Role } from "@/domain/entities/user";

export default function RootLayout() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();
  const { setClaims, clear: clearRole } = useRoleStore();

  useEffect(() => {
    // TODO(cleanup): temporary diagnostic — remove once persistence is confirmed working.
    AsyncStorage.getAllKeys().then((keys) => {
      const authKeys = keys.filter((k) => k.toLowerCase().includes("firebase") || k.toLowerCase().includes("authuser"));
      console.log("[_layout] AsyncStorage keys on boot:", keys);
      console.log("[_layout] firebase/auth-related keys:", authKeys);
    });

    const unsubscribe = onAuthChange((firebaseUser) => {
      console.log("[_layout] onAuthChange fired, firebaseUser =", firebaseUser?.uid ?? null);
      setUser(firebaseUser);
      setLoading(false);

      if (!firebaseUser) {
        clearRole();
        return;
      }

      // Force-refresh: a newly-provisioned account's claims (see
      // scripts/provisionAccount.ts) won't show up on a cached token.
      firebaseUser
        .getIdTokenResult(true)
        .then(async (tokenResult) => {
          const role = tokenResult.claims.role as Role | undefined;
          const ownerId = tokenResult.claims.ownerId as string | undefined;
          // TODO(cleanup): temporary diagnostic while rolling out roles — remove once confirmed working.
          console.log("[_layout] claims from token:", tokenResult.claims);
          setClaims({ role, ownerId });
          if (role === "admin" && ownerId) {
            await migrateOwnerAndPricingOnce(ownerId);
          }
          if (ownerId) resyncRemindersOnce(firebaseUser.uid, ownerId);
        })
        .catch((e) => console.error("[_layout] getIdTokenResult failed:", e));
    });
    requestNotificationPermission();
    return unsubscribe;
  }, []);

  if (isLoading) {
    // Avoid a flash of the login screen while the persisted session (if
    // any) is still being restored from AsyncStorage.
    return <LoadingSpinner fullScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        <Stack.Protected guard={!!user}>
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
        </Stack.Protected>
      </Stack>
    </GestureHandlerRootView>
  );
}
