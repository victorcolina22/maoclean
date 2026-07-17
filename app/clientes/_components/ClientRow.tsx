import React from "react";
import { View, Text, Pressable } from "react-native";
import dayjs from "dayjs";
import type { DerivedClient } from "@/utils/clientUtils";
import { formatCLP } from "@/utils/formatUtils";
import { PhoneLink } from "@/components/ui/PhoneLink";
import { useIsAdmin } from "@/stores/useRoleStore";

interface ClientRowProps {
  client: DerivedClient;
  onPress: () => void;
}

export function ClientRow({ client, onPress }: ClientRowProps) {
  const isAdmin = useIsAdmin();
  const lastVisitDate = dayjs(client.lastVisitAt.toDate()).format("D MMM YYYY");

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-xl px-4 py-3 mb-2 border border-neutral-100"
    >
      {/* Top row */}
      <View className="flex-row justify-between items-start mb-1">
        <View className="flex-1 mr-3">
          <Text
            className="text-base font-semibold text-neutral-900"
            numberOfLines={1}
          >
            {client.clientName}
          </Text>
          {client.clientPhone ? (
            <View className="self-start">
              <PhoneLink
                phone={client.clientPhone}
                textClassName="text-sm text-neutral-500"
              />
            </View>
          ) : (
            <Text className="text-sm text-neutral-400">Sin teléfono</Text>
          )}
        </View>
        <View className="items-end">
          {isAdmin && (
            <Text className="text-base font-bold text-neutral-900">
              {formatCLP(client.totalSpent)}
            </Text>
          )}
          <Text className="text-xs text-neutral-400">
            {client.appointmentCount}{" "}
            {client.appointmentCount === 1 ? "cita" : "citas"}
          </Text>
        </View>
      </View>

      {/* Bottom row */}
      <View className="flex-row justify-between items-center">
        <Text className="text-xs text-neutral-400">
          Última visita: {lastVisitDate}
        </Text>
        {isAdmin && client.pendingBalance > 0 && (
          <View className="bg-amber-50 px-2 py-0.5 rounded-full">
            <Text className="text-xs font-medium text-amber-700">
              Por cobrar: {formatCLP(client.pendingBalance)}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
