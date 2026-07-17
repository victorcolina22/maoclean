import { Unsubscribe } from "firebase/firestore";
import {
  Appointment,
  CreateAppointmentDTO,
  PaymentEntry,
  UpdateAppointmentDTO,
} from "../entities/appointment";
import { Result } from "@/utils/result";

export interface IAppointmentRepository {
  getByDate(ownerId: string, date: Date): Promise<Result<Appointment[]>>;
  getById(id: string): Promise<Result<Appointment>>;
  create(data: CreateAppointmentDTO): Promise<Result<Appointment>>;
  update(id: string, data: UpdateAppointmentDTO): Promise<Result<Appointment>>;
  delete(id: string): Promise<Result<void>>;
  addPayment(id: string, entry: PaymentEntry): Promise<Result<Appointment>>;
  subscribeToDate(
    ownerId: string,
    date: Date,
    callback: (appointments: Appointment[]) => void,
  ): Unsubscribe;
  subscribeToAll(
    ownerId: string,
    callback: (appointments: Appointment[]) => void,
  ): Unsubscribe;
  getAllForUser(ownerId: string): Promise<Result<Appointment[]>>;
}
