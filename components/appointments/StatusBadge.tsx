import React from 'react'
import { Badge } from '@/components/ui/Badge'
import { AppointmentStatus } from '@/domain/entities/appointment'

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Agendada',
  in_progress: 'En curso',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
}

const STATUS_COLORS: Record<AppointmentStatus, 'blue' | 'yellow' | 'green' | 'gray' | 'red'> = {
  scheduled: 'blue',
  in_progress: 'yellow',
  completed: 'green',
  cancelled: 'gray',
  no_show: 'red',
}

interface StatusBadgeProps {
  status: AppointmentStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge label={STATUS_LABELS[status]} color={STATUS_COLORS[status]} />
}
