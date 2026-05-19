import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { UserNotificationSettings, DEFAULT_NOTIFICATION_SETTINGS } from '@/domain/entities/userSettings'
import { Result, ok, err } from '@/utils/result'

function settingsDoc(uid: string) {
  return doc(db, 'users', uid, 'settings', 'notifications')
}

export const userSettingsRepository = {
  async getSettings(uid: string): Promise<Result<UserNotificationSettings>> {
    try {
      const snap = await getDoc(settingsDoc(uid))
      if (!snap.exists()) return ok(DEFAULT_NOTIFICATION_SETTINGS)
      const data = snap.data()
      return ok({
        remindersEnabled:
          typeof data.remindersEnabled === 'boolean'
            ? data.remindersEnabled
            : DEFAULT_NOTIFICATION_SETTINGS.remindersEnabled,
        remind24h:
          typeof data.remind24h === 'boolean'
            ? data.remind24h
            : DEFAULT_NOTIFICATION_SETTINGS.remind24h,
        remind1h:
          typeof data.remind1h === 'boolean'
            ? data.remind1h
            : DEFAULT_NOTIFICATION_SETTINGS.remind1h,
      })
    } catch {
      return err('No se pudo cargar la configuración de notificaciones.')
    }
  },

  async saveSettings(
    uid: string,
    settings: UserNotificationSettings,
  ): Promise<Result<undefined>> {
    try {
      await setDoc(settingsDoc(uid), settings, { merge: true })
      return ok(undefined)
    } catch {
      return err('No se pudo guardar la configuración. Intenta de nuevo.')
    }
  },
}
