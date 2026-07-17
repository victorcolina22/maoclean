import React from "react";
import { View, Text } from "react-native";

// Shown when a viewer-role account reaches an admin-only screen directly
// (deep link, stale navigation state) — the drawer/buttons that lead here
// are already hidden for viewers, this is the backstop.
export function NotAuthorized() {
  return (
    <View className="flex-1 items-center justify-center bg-neutral-50 px-6">
      <Text className="text-base text-neutral-500 text-center">
        No tienes acceso a esta sección.
      </Text>
    </View>
  );
}
