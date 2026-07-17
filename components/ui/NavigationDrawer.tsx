import React, { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDrawerStore } from "@/stores/useDrawerStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useIsAdmin } from "@/stores/useRoleStore";
import { logout } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const NAV_ITEMS: Array<{ icon: IoniconsName; label: string; route: string; adminOnly?: boolean }> = [
  { icon: "people-outline", label: "Clientes", route: "/clientes" },
  { icon: "bar-chart-outline", label: "Métricas", route: "/metricas", adminOnly: true },
  { icon: "notifications-outline", label: "Notificaciones", route: "/notificaciones" },
  { icon: "settings-outline", label: "Ajustes", route: "/ajustes" },
];

export default function NavigationDrawer() {
  const { width } = useWindowDimensions();
  const DRAWER_WIDTH = Math.min(width * 0.8, 320);
  const progress = useSharedValue(0);
  const isOpen = useDrawerStore((s) => s.isOpen);
  const close = useDrawerStore((s) => s.close);
  const user = useAuthStore((s) => s.user);
  const isAdmin = useIsAdmin();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    const DURATION = 400;
    if (isOpen) {
      progress.value = withSpring(1, { duration: DURATION });
    } else {
      progress.value = withTiming(0, { duration: DURATION });
    }
  }, [isOpen]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.5]),
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-DRAWER_WIDTH, 0]) },
    ],
  }));

  const handleNavItem = (route: string) => {
    close();
    router.push(route as Parameters<typeof router.push>[0]);
  };

  const handleLogout = async () => {
    await logout();
    close();
  };

  return (
    <View
      style={[StyleSheet.absoluteFillObject, { zIndex: 50 }]}
      pointerEvents={isOpen ? "auto" : "none"}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: "#000" },
          backdropStyle,
        ]}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={close} />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: DRAWER_WIDTH,
            backgroundColor: "#fff",
          },
          panelStyle,
        ]}
      >
        {/* Header */}
        <View
          className="border-b border-neutral-200 px-4 pb-4"
          style={{ paddingTop: insets.top + 16 }}
        >
          <Text className="text-xl font-bold text-primary-600">MaoClean</Text>
          <Text className="text-sm text-neutral-500">{user?.email ?? ""}</Text>
        </View>

        {/* Nav items */}
        <View className="flex-1 py-2">
          {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => (
            <Pressable
              key={item.route}
              onPress={() => handleNavItem(item.route)}
              className="flex-row items-center gap-3 px-4 py-3"
            >
              <Ionicons name={item.icon} size={22} color="#374151" />
              <Text className="text-base font-medium text-neutral-800">
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Sign out */}
        <View
          className="border-t border-neutral-200 px-4 py-4"
          style={{ paddingBottom: insets.bottom + 8 }}
        >
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center gap-3"
          >
            <Ionicons name="log-out-outline" size={22} color="#dc2626" />
            <Text className="text-base font-medium text-red-600">
              Cerrar sesión
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}
