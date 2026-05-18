import { View, Text } from 'react-native'
import type { RankedBar } from '@/utils/metricsUtils'

interface BarChartRowProps {
  row: RankedBar
  max: number
  valueLabel?: string
}

export function BarChartRow({ row, max, valueLabel }: BarChartRowProps) {
  const pct = max > 0 ? Math.max(2, Math.round((row.value / max) * 100)) : 0
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm text-neutral-700 flex-1 mr-2" numberOfLines={1}>{row.label}</Text>
        <Text className="text-sm font-semibold text-neutral-900">{valueLabel ?? String(row.value)}</Text>
      </View>
      <View className="h-2 w-full rounded-full bg-neutral-100">
        <View style={{ width: `${pct}%` }} className="h-2 rounded-full bg-primary-500" />
      </View>
    </View>
  )
}
