import React, { useMemo } from "react";
import { View, FlatList, Pressable, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAllAppointments } from "@/hooks/useAppointments";
import {
  APPOINTMENT_FILTERS,
  isFilterSlug,
} from "@/constants/appointment-filters";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import AppBar from "@/components/ui/AppBar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

export default function FilterScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const { appointments, isLoading } = useAllAppointments();

  if (!isFilterSlug(type)) {
    return (
      <View className="flex-1 bg-neutral-50">
        <AppBar
          title="Filtro"
          showHamburger={false}
          leftSlot={
            <Pressable onPress={() => router.back()} className="mr-3 p-1">
              <Text className="text-neutral-700 text-xl">‹</Text>
            </Pressable>
          }
        />
        <EmptyState
          title="Filtro no válido"
          description="El tipo de filtro no existe."
        />
      </View>
    );
  }

  const filter = APPOINTMENT_FILTERS[type];

  const filtered = useMemo(
    () =>
      appointments
        .filter(filter.predicate)
        .sort((a, b) => b.scheduledAt.seconds - a.scheduledAt.seconds),
    [appointments, filter],
  );

  return (
    <View className="flex-1 bg-neutral-50">
      <AppBar
        title={filter.title}
        showHamburger={false}
        leftSlot={
          <Pressable onPress={() => router.back()} className="mr-3 p-1">
            <Text className="text-neutral-700 text-xl">‹</Text>
          </Pressable>
        }
      />

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 32,
          }}
          renderItem={({ item }) => <AppointmentCard appointment={item} />}
          ListEmptyComponent={
            <EmptyState
              title="Sin resultados"
              description="No hay citas que coincidan con este filtro."
            />
          }
        />
      )}
    </View>
  );
}
