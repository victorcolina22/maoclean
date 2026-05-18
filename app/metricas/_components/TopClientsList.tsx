import { View, Text } from 'react-native'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/es'
import type { TopClient } from '@/utils/metricsUtils'

dayjs.extend(utc)
dayjs.extend(timezone)

interface TopClientsListProps {
  clients: TopClient[]
  formatCurrency: (v: number) => string
}

export function TopClientsList({ clients, formatCurrency }: TopClientsListProps) {
  return (
    <View className="mt-6">
      <Text className="text-base font-bold text-neutral-900 mb-3">Mejores clientes</Text>
      {clients.length === 0 ? (
        <View className="rounded-xl bg-neutral-50 p-6 items-center">
          <Text className="text-sm text-neutral-400">Sin datos en este período</Text>
        </View>
      ) : (
        clients.map((c, i) => (
          <View key={c.clientName} className="flex-row items-center justify-between py-3 border-b border-neutral-100">
            <View className="flex-row items-center flex-1 mr-3">
              <Text className="w-6 text-sm font-bold text-neutral-400">{i + 1}</Text>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-neutral-900" numberOfLines={1}>{c.clientName}</Text>
                <Text className="text-xs text-neutral-500">
                  Última visita: {dayjs(c.lastVisitAt.toDate()).tz('America/Santiago').locale('es').format('D MMM YYYY')}
                </Text>
              </View>
            </View>
            <Text className="text-sm font-bold text-neutral-900">{formatCurrency(c.totalPaid)}</Text>
          </View>
        ))
      )}
    </View>
  )
}
