import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  Appointment,
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
} from "@/domain/entities/appointment";
import { IAppointmentRepository } from "@/domain/interfaces/IAppointmentRepository";
import { Result, ok, err } from "@/utils/result";
import { startOfDay, endOfDay } from "@/utils/dateUtils";

const COL = "appointments";

function toAppointment(id: string, data: Record<string, unknown>): Appointment {
  return { id, ...data } as Appointment;
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  );
}

export const appointmentRepository: IAppointmentRepository = {
  async getByDate(userId: string, date: Date): Promise<Result<Appointment[]>> {
    try {
      const start = Timestamp.fromDate(startOfDay(date));
      const end = Timestamp.fromDate(endOfDay(date));

      const q = query(
        collection(db, COL),
        where("userId", "==", userId),
        where("scheduledAt", ">=", start),
        where("scheduledAt", "<=", end),
      );

      const snap = await getDocs(q);
      const appointments = snap.docs.map((d) => toAppointment(d.id, d.data()));
      return ok(appointments);
    } catch {
      return err("No se pudieron cargar las citas.");
    }
  },

  async getById(id: string): Promise<Result<Appointment>> {
    try {
      const snap = await getDoc(doc(db, COL, id));
      if (!snap.exists()) return err("Cita no encontrada.");
      return ok(toAppointment(snap.id, snap.data()));
    } catch {
      return err("No se pudo cargar la cita.");
    }
  },

  async create(data: CreateAppointmentDTO): Promise<Result<Appointment>> {
    try {
      const payload = stripUndefined({
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const ref = await addDoc(collection(db, COL), payload);
      const snap = await getDoc(ref);
      return ok(toAppointment(snap.id, snap.data()!));
    } catch (e) {
      console.error("[appointmentRepository.create]", e);
      return err("No se pudo crear la cita. Intenta de nuevo.");
    }
  },

  async update(
    id: string,
    data: UpdateAppointmentDTO,
  ): Promise<Result<Appointment>> {
    try {
      const ref = doc(db, COL, id);
      await updateDoc(
        ref,
        stripUndefined({ ...data, updatedAt: serverTimestamp() }),
      );
      const snap = await getDoc(ref);
      return ok(toAppointment(snap.id, snap.data()!));
    } catch {
      return err("No se pudo actualizar la cita.");
    }
  },

  async delete(id: string): Promise<Result<void>> {
    try {
      await deleteDoc(doc(db, COL, id));
      return ok(undefined);
    } catch {
      return err("No se pudo eliminar la cita.");
    }
  },

  subscribeToDate(
    userId: string,
    date: Date,
    callback: (appointments: Appointment[]) => void,
  ): Unsubscribe {
    const start = Timestamp.fromDate(startOfDay(date));
    const end = Timestamp.fromDate(endOfDay(date));

    const q = query(
      collection(db, COL),
      where("userId", "==", userId),
      where("scheduledAt", ">=", start),
      where("scheduledAt", "<=", end),
    );

    return onSnapshot(q, (snap) => {
      const appointments = snap.docs.map((d) => toAppointment(d.id, d.data()));
      callback(appointments);
    });
  },

  subscribeToAll(
    userId: string,
    callback: (appointments: Appointment[]) => void,
  ): Unsubscribe {
    const q = query(collection(db, COL), where("userId", "==", userId));

    return onSnapshot(q, (snap) => {
      const appointments = snap.docs.map((d) => toAppointment(d.id, d.data()));
      callback(appointments);
    });
  },
};
