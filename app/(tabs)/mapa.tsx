import React, { useEffect, useMemo } from "react";
import { View, Text, Pressable, ScrollView, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppointmentsStore } from "@/stores/useAppointmentsStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useZonesStore } from "@/stores/useZonesStore";
import { AppMapView } from "@/components/map/MapView";
import { AppointmentMarker } from "@/components/map/AppointmentMarker";
import { useDrawerStore } from "@/stores/useDrawerStore";
import { groupByCommune } from "@/services/proximityService";
import { getZoneForCommune } from "@/services/zoneService";
import AppBar from "@/components/ui/AppBar";

function buildMapsUrl(
  appointments: {
    location: { coordinates: { latitude: number; longitude: number } };
  }[],
): string {
  const waypoints = appointments
    .map(
      (a) =>
        `${a.location.coordinates.latitude},${a.location.coordinates.longitude}`,
    )
    .join("|");
  return `https://www.google.com/maps/dir/?api=1&waypoints=${waypoints}&travelmode=driving`;
}

export default function MapaScreen() {
  const router = useRouter();
  const { appointments } = useAppointmentsStore();
  const insets = useSafeAreaInsets();
  const toggle = useDrawerStore((s) => s.toggle);
  const user = useAuthStore((s) => s.user);
  const zones = useZonesStore((s) => s.zones);
  const loadZones = useZonesStore((s) => s.load);

  useEffect(() => {
    if (user?.uid) loadZones(user.uid);
  }, [user?.uid]);

  const withCoords = appointments.filter(
    (a) =>
      a.location?.coordinates?.latitude && a.location?.coordinates?.longitude,
  );

  const communeGroups = useMemo(
    () =>
      Array.from(groupByCommune(withCoords).entries())
        .filter(([, group]) => group.length > 0)
        .sort((a, b) => b[1].length - a[1].length),
    [withCoords],
  );

  const colorByCommune = useMemo(() => {
    const m = new Map<string, string | undefined>();
    for (const [commune] of communeGroups) {
      m.set(commune, getZoneForCommune(zones, commune)?.color);
    }
    return m;
  }, [communeGroups, zones]);

  return (
    <View className="flex-1  bg-neutral-50">
      <View className="z-50">
        <AppBar
          title="Mapa"
          rightSlot={
            <Pressable
              onPress={() => router.push("/appointment/new")}
              className="bg-primary-600 rounded-xl px-4 py-2"
            >
              <Text className="text-white font-semibold">+ Nueva</Text>
            </Pressable>
          }
        />
      </View>

      <View className="px-5 mt-5 flex-1">
        <View className="z-10">
          <Text className="text-base font-semibold text-neutral-900 bg-white rounded-xl px-4 py-2 shadow-sm border border-neutral-100">
            🗺️ {withCoords.length} citas en el mapa
          </Text>
        </View>

        <AppMapView>
          {withCoords.map((a) => (
            <AppointmentMarker
              key={a.id}
              appointment={a}
              onPress={() => router.push(`/appointment/${a.id}`)}
              color={colorByCommune.get(a.location?.commune?.trim())}
            />
          ))}
        </AppMapView>

        {communeGroups.length > 0 && (
          <View
            className="bg-white border-t border-neutral-100 rounded-xl mt-8"
            style={{ bottom: insets.bottom, zIndex: 10 }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                gap: 10,
              }}
            >
              {communeGroups.map(([commune, group]) => {
                const zoneColor = colorByCommune.get(commune);
                return (
                  <Pressable
                    key={commune}
                    onPress={() => Linking.openURL(buildMapsUrl(group))}
                    className="flex-row items-center gap-2 rounded-xl px-4 py-2"
                    style={{ backgroundColor: zoneColor ?? "#2563EB" }}
                  >
                    <Text className="text-white text-sm">🧭</Text>
                    <Text className="text-white text-sm font-medium">
                      {commune}
                    </Text>
                    <View className="bg-white/20 rounded-full px-1.5">
                      <Text className="text-white text-xs font-bold">
                        {group.length}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}
