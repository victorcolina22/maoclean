import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { Appointment } from '@/domain/entities/appointment'
import { UserNotificationSettings, DEFAULT_NOTIFICATION_SETTINGS } from '@/domain/entities/userSettings'
import { toSantiago } from '@/utils/dateUtils'
import { summarizeItems } from '@/constants/services'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    })
  }

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export async function scheduleAppointmentReminder(
  appointment: Appointment,
  settings: UserNotificationSettings = DEFAULT_NOTIFICATION_SETTINGS,
): Promise<void> {
  if (!settings.remindersEnabled) return

  const scheduledAt = toSantiago(appointment.scheduledAt)
  const serviceLabel = summarizeItems(appointment.items)

  const reminder24h = scheduledAt.subtract(24, 'hour').toDate()
  const reminder1h = scheduledAt.subtract(1, 'hour').toDate()
  const now = new Date()

  if (settings.remind24h && reminder24h > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Recordatorio de cita',
        body: `Mañana: ${serviceLabel} en ${appointment.location.commune}`,
        data: { appointmentId: appointment.id },
      },
      trigger: { date: reminder24h, type: Notifications.SchedulableTriggerInputTypes.DATE },
    })
  }

  if (settings.remind1h && reminder1h > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Cita en 1 hora',
        body: `${serviceLabel} · ${appointment.location.address}`,
        data: { appointmentId: appointment.id },
      },
      trigger: { date: reminder1h, type: Notifications.SchedulableTriggerInputTypes.DATE },
    })
  }
}

export async function cancelAppointmentReminders(appointmentId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  const toCancel = scheduled.filter(
    (n) => n.content.data?.appointmentId === appointmentId
  )
  await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)))
}

export async function cancelAllAppointmentReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  const toCancel = scheduled.filter((n) => n.content.data?.appointmentId !== undefined)
  await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)))
}
