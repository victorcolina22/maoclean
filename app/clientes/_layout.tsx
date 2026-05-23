import React from "react";
import { Stack } from "expo-router";

export default function ClientesLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Clientes" }} />
      <Stack.Screen name="[name]" options={{ title: "" }} />
    </Stack>
  );
}
