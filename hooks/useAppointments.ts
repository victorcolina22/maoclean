import { useEffect, useCallback, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRoleStore } from "@/stores/useRoleStore";
import { useAppointmentsStore } from "@/stores/useAppointmentsStore";
import { useProximityStore } from "@/stores/useProximityStore";
import { appointmentRepository } from "@/services/appointmentRepository";
import { userSettingsRepository } from "@/services/userSettingsRepository";
import { calculateProximity } from "@/services/proximityService";
import {
  scheduleAppointmentReminder,
  cancelAppointmentReminders,
} from "@/services/notificationService";
import { DEFAULT_NOTIFICATION_SETTINGS } from "@/domain/entities/userSettings";
import {
  Appointment,
  CreateAppointmentDTO,
  PaymentEntry,
  UpdateAppointmentDTO,
} from "@/domain/entities/appointment";

export function useAppointments() {
  const { user } = useAuthStore();
  const ownerId = useRoleStore((s) => s.ownerId);

  const resolveSettings = async () => {
    if (!user?.uid) return DEFAULT_NOTIFICATION_SETTINGS
    const r = await userSettingsRepository.getSettings(user.uid)
    return r.success ? r.data : DEFAULT_NOTIFICATION_SETTINGS
  }
  const {
    appointments,
    selectedDate,
    isLoading,
    error,
    setAppointments,
    setLoading,
    setError,
  } = useAppointmentsStore();
  const { setSuggestions } = useProximityStore();

  useEffect(() => {
    if (!ownerId) return;

    setLoading(true);

    const unsubscribe = appointmentRepository.subscribeToDate(
      ownerId,
      selectedDate,
      (updated) => {
        setAppointments(updated);
        setSuggestions(calculateProximity(updated));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [ownerId, selectedDate]);

  const create = useCallback(
    async (data: Omit<CreateAppointmentDTO, "userId" | "ownerId">) => {
      if (!user || !ownerId) return { success: false, error: "No autenticado" };

      const result = await appointmentRepository.create({
        ...data,
        userId: user.uid,
        ownerId,
      });
      if (result.success) {
        const settings = await resolveSettings()
        await scheduleAppointmentReminder(result.data, settings);
      } else {
        setError(result.error);
      }
      return result;
    },
    [user, ownerId],
  );

  const update = useCallback(async (id: string, data: UpdateAppointmentDTO) => {
    const result = await appointmentRepository.update(id, data);
    if (!result.success) setError(result.error);
    if (result.success && data.scheduledAt) {
      await cancelAppointmentReminders(id);
      const settings = await resolveSettings()
      await scheduleAppointmentReminder(result.data, settings);
    }
    return result;
  }, []);

  const remove = useCallback(async (id: string) => {
    const result = await appointmentRepository.delete(id);
    if (!result.success) setError(result.error);
    else await cancelAppointmentReminders(id);
    return result;
  }, []);

  const addPayment = useCallback(async (id: string, entry: PaymentEntry) => {
    const result = await appointmentRepository.addPayment(id, entry)
    if (!result.success) setError(result.error)
    return result
  }, [])

  return { appointments, isLoading, error, create, update, remove, addPayment };
}

// All appointments for the org, regardless of date. Useful for calendar view or similar features.
export function useAllAppointments() {
  const ownerId = useRoleStore((s) => s.ownerId);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;

    setIsLoading(true);

    const unsubscribe = appointmentRepository.subscribeToAll(
      ownerId,
      (updated) => {
        setAppointments(updated);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [ownerId]);

  return { appointments, isLoading };
}
