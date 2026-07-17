// TODO(cleanup): one-time migration to fix reminders scheduled before the
// Hermes/Intl timezone fix (dayjs `.tz()` was a no-op + `parseScheduledAt`
// wasn't anchored to America/Santiago, so stored `scheduledAt` and their
// derived reminders could be off by hours). Safe to delete this whole file
// and its call site in app/_layout.tsx once the fix has been out for a
// while — it has no purpose after every install has run it once.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { userSettingsRepository } from "./userSettingsRepository";
import { appointmentRepository } from "./appointmentRepository";
import {
  cancelAllAppointmentReminders,
  scheduleAppointmentReminder,
} from "./notificationService";
import { DEFAULT_NOTIFICATION_SETTINGS } from "@/domain/entities/userSettings";

const FLAG_KEY = "tzFixReminderResync_v1";

// In-memory guard against two overlapping calls in the same app session
// (e.g. a quick logout/login firing onAuthChange twice) racing each other —
// the AsyncStorage flag alone can't catch that since it's only written after
// the whole migration finishes.
let runningForUserId: string | null = null;

// userId: the signed-in account, used for its own personal reminder
// settings (each person can have different remind24h/remind1h prefs).
// ownerId: the org whose shared appointments to reschedule reminders for
// (may equal userId for the owner account itself).
export async function resyncRemindersOnce(userId: string, ownerId: string): Promise<void> {
  if (runningForUserId === userId) return;

  const alreadyRun = await AsyncStorage.getItem(FLAG_KEY);
  if (alreadyRun) return;

  runningForUserId = userId;
  try {
    // getAllForUser forces a server read (no local-cache ambiguity) so this
    // one-shot migration can't act on a stale/incomplete cached snapshot.
    const result = await appointmentRepository.getAllForUser(ownerId);
    if (!result.success) return;

    await cancelAllAppointmentReminders();

    const settingsResult = await userSettingsRepository.getSettings(userId);
    const settings = settingsResult.success
      ? settingsResult.data
      : DEFAULT_NOTIFICATION_SETTINGS;

    const now = new Date();
    for (const appointment of result.data) {
      const isPending =
        appointment.status === "scheduled" ||
        appointment.status === "in_progress";
      if (isPending && appointment.scheduledAt.toDate() > now) {
        await scheduleAppointmentReminder(appointment, settings);
      }
    }

    await AsyncStorage.setItem(FLAG_KEY, "true");
  } catch (e) {
    console.error("[notificationMigration] resync failed, will retry next login", e);
  } finally {
    runningForUserId = null;
  }
}
