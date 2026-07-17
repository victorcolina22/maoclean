import React from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppointments, useAllAppointments } from "@/hooks/useAppointments";
import { StatTile } from "@/components/home/StatTile";
import { APPOINTMENT_FILTERS } from "@/constants/appointment-filters";
import type { FilterSlug } from "@/constants/appointment-filters";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { ProximityAlert } from "@/components/proximity/ProximityAlert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/utils/dateUtils";
import AppBar from "@/components/ui/AppBar";
import { useIsAdmin } from "@/stores/useRoleStore";

export default function HomeScreen() {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const { appointments, isLoading } = useAppointments();
  const { appointments: allAppointments } = useAllAppointments();
  const today = new Date();

  const TILE_DEFS: Array<{
    slug: FilterSlug
    label: string
    icon: React.ReactNode
    bgClass: string
    borderClass: string
  }> = [
    { slug: 'pagos-pendientes', label: 'Pagos pendientes', icon: <Ionicons name="card-outline" size={22} color="#f59e0b" />, bgClass: 'bg-amber-50', borderClass: 'border-l-amber-500' },
    { slug: 'esta-semana',      label: 'Esta semana',      icon: <Ionicons name="calendar-outline" size={22} color="#2563eb" />, bgClass: 'bg-blue-50',  borderClass: 'border-l-primary-600' },
    { slug: 'en-proceso',       label: 'En proceso',       icon: <Ionicons name="time-outline" size={22} color="#f97316" />, bgClass: 'bg-orange-50', borderClass: 'border-l-orange-500' },
    { slug: 'completadas',      label: 'Completadas',      icon: <Ionicons name="checkmark-circle-outline" size={22} color="#16a34a" />, bgClass: 'bg-green-50',  borderClass: 'border-l-green-600' },
  ]

  const HIDDEN_FOR_VIEWER: FilterSlug[] = ['pagos-pendientes', 'en-proceso']

  const tileCounts = TILE_DEFS
    .filter((def) => isAdmin || !HIDDEN_FOR_VIEWER.includes(def.slug))
    .map((def) => ({
      ...def,
      count: allAppointments.filter(APPOINTMENT_FILTERS[def.slug].predicate).length,
    }))

  const sorted = [...appointments].sort(
    (a, b) => a.scheduledAt.seconds - b.scheduledAt.seconds,
  );

  return (
    <View className="flex-1 bg-neutral-50">
      <AppBar
        title="Hoy"
        subtitle={formatDate(today)}
        rightSlot={
          isAdmin ? (
            <Pressable
              onPress={() => router.push("/appointment/new")}
              className="bg-primary-600 rounded-xl px-4 py-2"
            >
              <Text className="text-white font-semibold">+ Cita</Text>
            </Pressable>
          ) : undefined
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
          ListHeaderComponent={
            <>
              <ProximityAlert />
              <View className="flex-row flex-wrap justify-between mt-2 mb-1">
                {tileCounts.map((tile) => (
                  <StatTile
                    key={tile.slug}
                    label={tile.label}
                    count={tile.count}
                    icon={tile.icon}
                    bgClass={tile.bgClass}
                    borderClass={tile.borderClass}
                    onPress={() => router.push(`/filter/${tile.slug}` as any)}
                  />
                ))}
              </View>
            </>
          }
          renderItem={({ item }) => <AppointmentCard appointment={item} />}
          ListEmptyComponent={
            <EmptyState
              title="Sin citas hoy"
              description="Agrega tu primera cita del día."
              action={
                isAdmin ? (
                  <Button
                    label="Nueva cita"
                    onPress={() => router.push("/appointment/new")}
                  />
                ) : undefined
              }
            />
          }
        />
      )}
    </View>
  );
}
