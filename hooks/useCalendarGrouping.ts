import '@/utils/dateUtils'           // side-effect: registers dayjs utc + timezone plugins
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { Appointment } from '@/domain/entities/appointment'
import { TZ } from '@/constants/calendar'

export function useCalendarGrouping(appointments: Appointment[]): Map<string, Appointment[]> {
  return useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const a of appointments) {
      const key = dayjs(a.scheduledAt.toDate()).tz(TZ).format('YYYY-MM-DD')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(a)
    }
    return map
  }, [appointments])
}
