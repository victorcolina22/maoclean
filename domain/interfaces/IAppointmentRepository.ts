import { Unsubscribe } from "firebase/firestore";
import {
  Appointment,
  CreateAppointmentDTO,
  PaymentEntry,
  UpdateAppointmentDTO,
} from "../entities/appointment";
import { Result } from "@/utils/result";

export interface IAppointmentRepository {
  getByDate(userId: string, date: Date): Promise<Result<Appointment[]>>;
  getById(id: string): Promise<Result<Appointment>>;
  create(data: CreateAppointmentDTO): Promise<Result<Appointment>>;
  update(id: string, data: UpdateAppointmentDTO): Promise<Result<Appointment>>;
  delete(id: string): Promise<Result<void>>;
  addPayment(id: string, entry: PaymentEntry): Promise<Result<Appointment>>;
  subscribeToDate(
    userId: string,
    date: Date,
    callback: (appointments: Appointment[]) => void,
  ): Unsubscribe;
  subscribeToAll(
    userId: string,
    callback: (appointments: Appointment[]) => void,
  ): Unsubscribe;
  getAllForUser(userId: string): Promise<Result<Appointment[]>>;
}
