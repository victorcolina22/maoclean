import { AppointmentStatus } from '@/domain/entities/appointment'

export type CalendarView = 'month' | 'week' | 'list'

export const TZ = 'America/Santiago'

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled:   '#3b82f6',
  in_progress: '#ca8a04',
  completed:   '#16a34a',
  cancelled:   '#9ca3af',
  no_show:     '#dc2626',
}

export const HOUR_START        = 7
export const HOUR_END          = 21
export const PX_PER_MIN        = 1.5
export const MIN_BLOCK_MINUTES = 30
export const TOTAL_HEIGHT      = (HOUR_END - HOUR_START) * 60 * PX_PER_MIN  // 1260

export const WEEKDAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
