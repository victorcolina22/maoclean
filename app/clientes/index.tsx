import React, { useState, useMemo } from "react";
import { View, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useAllAppointments } from "@/hooks/useAppointments";
import { deriveClients, filterClients, sortClients } from "@/utils/clientUtils";
import type { ClientSort } from "@/utils/clientUtils";
import { ClientRow } from "./_components/ClientRow";
import { SegmentedControl } from "@/components/calendar/SegmentedControl";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useIsAdmin } from "@/stores/useRoleStore";

const SORT_OPTIONS: { label: string; value: ClientSort }[] = [
  { label: "Nombre", value: "name" },
  { label: "Gastado", value: "spent" },
  { label: "Reciente", value: "recent" },
];

export default function ClientesScreen() {
  const isAdmin = useIsAdmin();
  const sortOptions = isAdmin
    ? SORT_OPTIONS
    : SORT_OPTIONS.filter((o) => o.value !== "spent");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ClientSort>("recent");
  const { appointments, isLoading } = useAllAppointments();
  const router = useRouter();

  const clients = useMemo(() => deriveClients(appointments), [appointments]);
  const filtered = useMemo(
    () => filterClients(clients, query),
    [clients, query],
  );
  const sorted = useMemo(() => sortClients(filtered, sort), [filtered, sort]);

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <View className="flex-1 bg-neutral-50">
      <View className="px-4 pt-4">
        <Input
          placeholder="Buscar cliente..."
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <SegmentedControl
        value={sort}
        options={sortOptions}
        onChange={setSort}
      />
      <FlatList
        data={sorted}
        keyExtractor={(c) => c.clientName}
        renderItem={({ item }) => (
          <ClientRow
            client={item}
            onPress={() =>
              router.push(`/clientes/${encodeURIComponent(item.clientName)}`)
            }
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            title="Sin clientes"
            description={
              query
                ? "No hay clientes que coincidan con tu búsqueda."
                : "Aún no hay citas registradas."
            }
          />
        }
      />
    </View>
  );
}
