import React from "react";
import { View, Text, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";

interface ForceUpdateScreenProps {
  latestApkUrl?: string;
}

export function ForceUpdateScreen({ latestApkUrl }: ForceUpdateScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-neutral-50 px-8">
      <Ionicons name="cloud-download-outline" size={56} color="#2563EB" />
      <Text className="text-xl font-bold text-neutral-900 mt-4 text-center">
        Actualización requerida
      </Text>
      <Text className="text-base text-neutral-500 mt-2 text-center">
        Esta versión de MaoClean ya no está disponible. Descargá la versión
        más reciente para seguir usando la app.
      </Text>
      {latestApkUrl && (
        <Button
          label="Descargar última versión"
          onPress={() => Linking.openURL(latestApkUrl)}
          fullWidth
          className="mt-6"
        />
      )}
    </View>
  );
}
