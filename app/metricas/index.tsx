import React, { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { computeMetrics, type MetricsPeriod } from "@/utils/metricsUtils";
import { useAllAppointments } from "@/hooks/useAppointments";
import { formatCLP } from "@/utils/formatUtils";
import { SegmentedControl } from "@/components/calendar/SegmentedControl";
import { MetricCard } from "./_components/MetricCard";
import { MetricSection } from "./_components/MetricSection";
import { TopClientsList } from "./_components/TopClientsList";

const PERIOD_OPTIONS: { label: string; value: MetricsPeriod }[] = [
  { label: "Semana", value: "week" },
  { label: "Mes", value: "month" },
  { label: "Todo", value: "all" },
];

export default function MetricasScreen() {
  const [period, setPeriod] = useState<MetricsPeriod>("month");
  const { appointments, isLoading } = useAllAppointments();

  const metrics = useMemo(
    () => computeMetrics(appointments, period),
    [appointments, period],
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="bg-white"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <SegmentedControl
          value={period}
          options={PERIOD_OPTIONS}
          onChange={setPeriod}
        />

        {/* KPI row */}
        <View className="flex-row gap-3 px-4">
          <MetricCard
            label="Ingresos"
            value={formatCLP(metrics.revenueCollected)}
            variant="green"
          />
          <MetricCard
            label="Por cobrar"
            value={formatCLP(metrics.pendingRevenue)}
            variant="amber"
          />
          <MetricCard
            label="Citas"
            value={String(metrics.appointmentCount)}
            variant="neutral"
          />
        </View>

        {/* Sections */}
        <View className="px-4">
          <MetricSection
            title="Servicios más solicitados"
            data={metrics.topServices}
          />

          <MetricSection
            title="Ingresos por comuna"
            data={metrics.revenueByCommune}
            formatValue={formatCLP}
          />

          <TopClientsList
            clients={metrics.topClients}
            formatCurrency={formatCLP}
          />
        </View>
      </ScrollView>
    </View>
  );
}
