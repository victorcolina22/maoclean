import React from 'react'
import { Badge } from '@/components/ui/Badge'
import { PaymentStatus } from '@/domain/entities/appointment'

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: 'Por cobrar',
  paid: 'Pagado',
  partial: 'Parcial',
}

const PAYMENT_COLORS: Record<PaymentStatus, 'yellow' | 'green' | 'blue'> = {
  pending: 'yellow',
  paid: 'green',
  partial: 'blue',
}

interface PaymentBadgeProps {
  status: PaymentStatus
}

export function PaymentBadge({ status }: PaymentBadgeProps) {
  return <Badge label={PAYMENT_LABELS[status]} color={PAYMENT_COLORS[status]} />
}
