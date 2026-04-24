import { Unsubscribe } from 'firebase/firestore'
import { Appointment, CreateAppointmentDTO, UpdateAppointmentDTO } from '../entities/appointment'
import { Result } from '@/utils/result'

export interface IAppointmentRepository {
  getByDate(userId: string, date: Date): Promise<Result<Appointment[]>>
  getById(id: string): Promise<Result<Appointment>>
  create(data: CreateAppointmentDTO): Promise<Result<Appointment>>
  update(id: string, data: UpdateAppointmentDTO): Promise<Result<Appointment>>
  delete(id: string): Promise<Result<void>>
  subscribeToDate(
    userId: string,
    date: Date,
    callback: (appointments: Appointment[]) => void
  ): Unsubscribe
}
