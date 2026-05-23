import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

interface NavRowProps {
  label: string;
  description: string;
  onPress: () => void;
}

function NavRow({ label, description, onPress }: NavRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between bg-white rounded-2xl border border-neutral-200 px-4 py-3 mb-3"
    >
      <View className="flex-1">
        <Text className="text-sm font-semibold text-neutral-900">{label}</Text>
        <Text className="text-xs text-neutral-500">{description}</Text>
      </View>
      <Text className="text-neutral-400 text-base ml-2">›</Text>
    </Pressable>
  );
}

export default function AjustesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      className="flex-1 bg-neutral-50 px-4"
      style={{ paddingTop: 16, paddingBottom: insets.bottom + 16 }}
    >
      <NavRow
        label="Zonas"
        description="Agrupa comunas para colorear el mapa y organizar rutas"
        onPress={() => router.push("/ajustes/zonas")}
      />
    </SafeAreaView>
  );
}
