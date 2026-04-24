import { useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useAppointmentsStore } from '@/stores/useAppointmentsStore'
import { useProximityStore } from '@/stores/useProximityStore'
import { appointmentRepository } from '@/services/appointmentRepository'
import { calculateProximity } from '@/services/proximityService'
import { scheduleAppointmentReminder, cancelAppointmentReminders } from '@/services/notificationService'
import { CreateAppointmentDTO, UpdateAppointmentDTO } from '@/domain/entities/appointment'

export function useAppointments() {
  const { user } = useAuthStore()
  const { appointments, selectedDate, isLoading, error, setAppointments, setLoading, setError } =
    useAppointmentsStore()
  const { setSuggestions } = useProximityStore()

  useEffect(() => {
    if (!user) return

    setLoading(true)

    const unsubscribe = appointmentRepository.subscribeToDate(
      user.uid,
      selectedDate,
      (updated) => {
        setAppointments(updated)
        setSuggestions(calculateProximity(updated))
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user, selectedDate])

  const create = useCallback(
    async (data: Omit<CreateAppointmentDTO, 'userId'>) => {
      if (!user) return { success: false, error: 'No autenticado' }

      const result = await appointmentRepository.create({ ...data, userId: user.uid })
      if (result.success) {
        await scheduleAppointmentReminder(result.data)
      } else {
        setError(result.error)
      }
      return result
    },
    [user]
  )

  const update = useCallback(async (id: string, data: UpdateAppointmentDTO) => {
    const result = await appointmentRepository.update(id, data)
    if (!result.success) setError(result.error)
    if (result.success && data.scheduledAt) {
      await cancelAppointmentReminders(id)
      await scheduleAppointmentReminder(result.data)
    }
    return result
  }, [])

  const remove = useCallback(async (id: string) => {
    const result = await appointmentRepository.delete(id)
    if (!result.success) setError(result.error)
    else await cancelAppointmentReminders(id)
    return result
  }, [])

  return { appointments, isLoading, error, create, update, remove }
}
