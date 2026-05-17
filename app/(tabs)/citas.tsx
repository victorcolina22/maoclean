import React, { useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import "@/utils/dateUtils";
import AppBar from "@/components/ui/AppBar";
import { useAllAppointments } from "@/hooks/useAppointments";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { AppointmentStatus } from "@/domain/entities/appointment";
import { groupByCommune } from "@/services/proximityService";
import { CalendarView, TZ } from "@/constants/calendar";
import { SegmentedControl } from "@/components/calendar/SegmentedControl";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { WeekTimeline } from "@/components/calendar/WeekTimeline";
import { useCalendarGrouping } from "@/hooks/useCalendarGrouping";
import { useAppointmentsStore } from "@/stores/useAppointmentsStore";

const STATUS_FILTERS: { label: string; value: AppointmentStatus | "all" }[] = [
  { label: "Todas", value: "all" },
  { label: "Agendadas", value: "scheduled" },
  { label: "En curso", value: "in_progress" },
  { label: "Completadas", value: "completed" },
  { label: "Canceladas", value: "cancelled" },
];

export default function CitasScreen() {
  const router = useRouter();
  const { appointments, isLoading } = useAllAppointments();
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [communeFilter, setCommuneFilter] = useState<string | null>(null);
  const [view, setView] = useState<CalendarView>("list");
  const [displayedMonth, setDisplayedMonth] = useState(() => dayjs());
  const { selectedDate, setSelectedDate } = useAppointmentsStore();
  const dayMap = useCalendarGrouping(appointments);

  const selectedDateKey = dayjs(selectedDate).tz(TZ).format("YYYY-MM-DD");

  const handleDayPress = (date: Date) => {
    setSelectedDate(date);
    setView("week");
  };

  const communeGroups = useMemo(() => groupByCommune(appointments), [appointments]);

  const filtered = useMemo(() => {
    let result = appointments;
    if (statusFilter !== "all") result = result.filter((a) => a.status === statusFilter);
    if (communeFilter) result = result.filter((a) => a.location?.commune?.trim() === communeFilter);
    return result.sort((a, b) => b.scheduledAt.seconds - a.scheduledAt.seconds);
  }, [appointments, statusFilter, communeFilter]);

  const communeChips = useMemo(
    () =>
      Array.from(communeGroups.entries())
        .filter(([, group]) => group.length > 0)
        .sort((a, b) => b[1].length - a[1].length),
    [communeGroups],
  );

  return (
    <View className="flex-1 bg-neutral-50">
      <AppBar
        title="Citas"
        rightSlot={
          <Pressable
            onPress={() => router.push("/appointment/new")}
            className="bg-primary-600 rounded-xl px-4 py-2"
          >
            <Text className="text-white font-semibold">+ Nueva</Text>
          </Pressable>
        }
      />

      <SegmentedControl<CalendarView>
        value={view}
        options={[
          { label: "Mes",    value: "month" },
          { label: "Semana", value: "week"  },
          { label: "Lista",  value: "list"  },
        ]}
        onChange={setView}
      />

      {view === "month" && (
        <MonthGrid
          visibleMonth={displayedMonth}
          selectedDateKey={selectedDateKey}
          dayMap={dayMap}
          onDayPress={handleDayPress}
          onPrevMonth={() => setDisplayedMonth((m) => m.subtract(1, "month"))}
          onNextMonth={() => setDisplayedMonth((m) => m.add(1, "month"))}
        />
      )}

      {view === "week" && <WeekTimeline />}

      {view === "list" && (
        <>
          {/* Status filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}
            className="max-h-12"
          >
            {STATUS_FILTERS.map((f) => (
              <Pressable
                key={f.value}
                onPress={() => setStatusFilter(f.value)}
                className={`px-4 py-2 rounded-full border ${
                  statusFilter === f.value
                    ? "bg-primary-600 border-primary-600"
                    : "bg-white border-neutral-200"
                }`}
              >
                <Text
                  className={
                    statusFilter === f.value
                      ? "text-white text-sm font-medium"
                      : "text-neutral-600 text-sm"
                  }
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Commune zone filter */}
          {communeChips.length > 0 && (
            <View className="px-4 pb-2">
              <Text className="text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
                Por zona
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {communeFilter !== null && (
                  <Pressable
                    onPress={() => setCommuneFilter(null)}
                    className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-primary-600 border border-primary-600"
                  >
                    <Text className="text-white text-xs font-medium">✕ Todas las zonas</Text>
                  </Pressable>
                )}
                {communeChips.map(([commune, group]) => {
                  const active = communeFilter === commune;
                  return (
                    <Pressable
                      key={commune}
                      onPress={() => setCommuneFilter(active ? null : commune)}
                      className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                        active
                          ? "bg-primary-600 border-primary-600"
                          : "bg-white border-neutral-200"
                      }`}
                    >
                      <Text className={active ? "text-white text-xs font-medium" : "text-neutral-700 text-xs font-medium"}>
                        📍 {commune}
                      </Text>
                      <View className={`rounded-full px-1.5 ${active ? "bg-white/30" : "bg-neutral-100"}`}>
                        <Text className={active ? "text-white text-xs font-bold" : "text-neutral-600 text-xs font-bold"}>
                          {group.length}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

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
                  title="Sin citas"
                  description={
                    communeFilter
                      ? `No hay citas en ${communeFilter} con este filtro.`
                      : "No hay citas con este filtro."
                  }
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
        </>
      )}
    </View>
  );
}
