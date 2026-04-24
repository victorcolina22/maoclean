import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import duration from 'dayjs/plugin/duration'
import 'dayjs/locale/es'
import { Timestamp } from 'firebase/firestore'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(duration)
dayjs.locale('es')

const TZ = 'America/Santiago'

export function toSantiago(date: Date | Timestamp): dayjs.Dayjs {
  const d = date instanceof Timestamp ? date.toDate() : date
  return dayjs(d).tz(TZ)
}

export function formatDate(date: Date | Timestamp): string {
  return toSantiago(date).format('dddd, D [de] MMMM')
}

export function formatTime(date: Date | Timestamp): string {
  return toSantiago(date).format('HH:mm')
}

export function formatDateTime(date: Date | Timestamp): string {
  return toSantiago(date).format('DD/MM/YYYY HH:mm')
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

export function startOfDay(date: Date): Date {
  return dayjs(date).tz(TZ).startOf('day').toDate()
}

export function endOfDay(date: Date): Date {
  return dayjs(date).tz(TZ).endOf('day').toDate()
}

export function isToday(date: Date | Timestamp): boolean {
  const d = date instanceof Timestamp ? date.toDate() : date
  return toSantiago(d).isSame(dayjs().tz(TZ), 'day')
}

export function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date)
}
