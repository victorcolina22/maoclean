import { View, Text } from 'react-native'
import type { RankedBar } from '@/utils/metricsUtils'
import { BarChartRow } from './BarChartRow'

interface MetricSectionProps {
  title: string
  data: RankedBar[]
  formatValue?: (v: number) => string
}

export function MetricSection({ title, data, formatValue }: MetricSectionProps) {
  const max = data[0]?.value ?? 0
  return (
    <View className="mt-6">
      <Text className="text-base font-bold text-neutral-900 mb-3">{title}</Text>
      {data.length === 0 ? (
        <View className="rounded-xl bg-neutral-50 p-6 items-center">
          <Text className="text-sm text-neutral-400">Sin datos en este período</Text>
        </View>
      ) : (
        data.map((row) => (
          <BarChartRow
            key={row.key}
            row={row}
            max={max}
            valueLabel={formatValue ? formatValue(row.value) : undefined}
          />
        ))
      )}
    </View>
  )
}
