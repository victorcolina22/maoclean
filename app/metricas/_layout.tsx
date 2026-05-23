import React from "react";
import { Stack } from "expo-router";

export default function MetricasLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Métricas" }} />
    </Stack>
  );
}
