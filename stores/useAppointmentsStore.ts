import { create } from 'zustand'
import { Appointment } from '@/domain/entities/appointment'

interface AppointmentsState {
  appointments: Appointment[]
  selectedDate: Date
  isLoading: boolean
  error: string | null
  setAppointments: (appointments: Appointment[]) => void
  setSelectedDate: (date: Date) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addOrUpdate: (appointment: Appointment) => void
  remove: (id: string) => void
}

export const useAppointmentsStore = create<AppointmentsState>((set) => ({
  appointments: [],
  selectedDate: new Date(),
  isLoading: false,
  error: null,
  setAppointments: (appointments) => set({ appointments, error: null }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addOrUpdate: (appointment) =>
    set((state) => {
      const exists = state.appointments.some((a) => a.id === appointment.id)
      if (exists) {
        return {
          appointments: state.appointments.map((a) =>
            a.id === appointment.id ? appointment : a
          ),
        }
      }
      return { appointments: [...state.appointments, appointment] }
    }),
  remove: (id) =>
    set((state) => ({
      appointments: state.appointments.filter((a) => a.id !== id),
    })),
}))
