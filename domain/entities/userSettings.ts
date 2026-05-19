export interface UserNotificationSettings {
  remindersEnabled: boolean
  remind24h: boolean
  remind1h: boolean
}

export const DEFAULT_NOTIFICATION_SETTINGS: UserNotificationSettings = {
  remindersEnabled: true,
  remind24h: true,
  remind1h: true,
}
