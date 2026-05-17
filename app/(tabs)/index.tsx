import React from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAppointments } from "@/hooks/useAppointments";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { ProximityAlert } from "@/components/proximity/ProximityAlert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/utils/dateUtils";
import AppBar from "@/components/ui/AppBar";

export default function HomeScreen() {
  const router = useRouter();
  const { appointments, isLoading } = useAppointments();
  const today = new Date();

  const sorted = [...appointments].sort(
    (a, b) => a.scheduledAt.seconds - b.scheduledAt.seconds,
  );

  return (
    <View className="flex-1 bg-neutral-50">
      <AppBar
        title="Hoy"
        subtitle={formatDate(today)}
        rightSlot={
          <Pressable
            onPress={() => router.push("/appointment/new")}
            className="bg-primary-600 rounded-xl px-4 py-2"
          >
            <Text className="text-white font-semibold">+ Cita</Text>
          </Pressable>
        }
      />

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 32,
          }}
          ListHeaderComponent={<ProximityAlert />}
          renderItem={({ item }) => <AppointmentCard appointment={item} />}
          ListEmptyComponent={
            <EmptyState
              title="Sin citas hoy"
              description="Agrega tu primera cita del día."
              action={
                <Button
                  label="Nueva cita"
                  onPress={() => router.push("/appointment/new")}
                />
              }
            />
          }
        />
      )}
    </View>
  );
}
