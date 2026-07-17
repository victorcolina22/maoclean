import React from 'react'
import { View, Text } from 'react-native'
import type { DerivedClient } from '@/utils/clientUtils'
import { formatCLP } from '@/utils/formatUtils'
import { useIsAdmin } from '@/stores/useRoleStore'

interface ClientStatsHeaderProps {
  client: DerivedClient
}

const TILE_BG = {
  green: 'bg-green-50',
  amber: 'bg-amber-50',
  neutral: 'bg-neutral-100',
} as const

const TILE_VALUE = {
  green: 'text-green-700',
  amber: 'text-amber-700',
  neutral: 'text-neutral-800',
} as const

interface KpiTileProps {
  label: string
  value: string
  color: keyof typeof TILE_BG
}

function KpiTile({ label, value, color }: KpiTileProps) {
  return (
    <View className={`flex-1 rounded-xl p-3 items-center ${TILE_BG[color]}`}>
      <Text className={`text-base font-bold ${TILE_VALUE[color]}`}>{value}</Text>
      <Text className="text-xs text-neutral-500 mt-0.5 text-center">{label}</Text>
    </View>
  )
}

export function ClientStatsHeader({ client }: ClientStatsHeaderProps) {
  const isAdmin = useIsAdmin()
  return (
    <View className="flex-row gap-3 px-4 pt-4 pb-2">
      {isAdmin && (
        <>
          <KpiTile
            label="Total gastado"
            value={formatCLP(client.totalSpent)}
            color="green"
          />
          <KpiTile
            label="Por cobrar"
            value={formatCLP(client.pendingBalance)}
            color="amber"
          />
        </>
      )}
      <KpiTile
        label="Citas"
        value={String(client.appointmentCount)}
        color="neutral"
      />
    </View>
  )
}
