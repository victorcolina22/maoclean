import { View, Text } from 'react-native'

type MetricCardVariant = 'green' | 'amber' | 'neutral'

interface MetricCardProps {
  label: string
  value: string
  variant?: MetricCardVariant
}

const VARIANT_CLASS: Record<MetricCardVariant, string> = {
  green: 'bg-green-50 border-green-200',
  amber: 'bg-amber-50 border-amber-200',
  neutral: 'bg-neutral-50 border-neutral-100',
}

export function MetricCard({ label, value, variant = 'neutral' }: MetricCardProps) {
  return (
    <View className={`flex-1 rounded-2xl border p-4 ${VARIANT_CLASS[variant]}`}>
      <Text className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</Text>
      <Text className="mt-2 text-2xl font-bold text-neutral-900" numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  )
}
