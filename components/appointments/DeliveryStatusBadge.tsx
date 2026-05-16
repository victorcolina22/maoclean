import React from 'react'
import { Badge } from '@/components/ui/Badge'
import { DeliveryStatus } from '@/domain/entities/appointment'

const DELIVERY_LABELS: Record<DeliveryStatus, string> = {
  ok: 'Entrega OK',
  soon: 'Entrega próxima',
  late: 'Entrega vencida',
}

const DELIVERY_COLORS: Record<DeliveryStatus, 'green' | 'yellow' | 'red'> = {
  ok: 'green',
  soon: 'yellow',
  late: 'red',
}

interface DeliveryStatusBadgeProps {
  status: DeliveryStatus | undefined
}

export function DeliveryStatusBadge({ status }: DeliveryStatusBadgeProps) {
  if (!status) return null
  return <Badge label={DELIVERY_LABELS[status]} color={DELIVERY_COLORS[status]} />
}
