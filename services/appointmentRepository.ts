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
  DocumentSnapshot,
  DocumentData,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  Appointment,
  CreateAppointmentDTO,
  PaymentEntry,
  ServiceItem,
  ServiceType,
  UpdateAppointmentDTO,
} from "@/domain/entities/appointment";
import { SERVICE_LABELS } from "@/constants/services";
import { IAppointmentRepository } from "@/domain/interfaces/IAppointmentRepository";
import { Result, ok, err } from "@/utils/result";
import { startOfDay, endOfDay } from "@/utils/dateUtils";
import { derivePaymentStatus } from "@/utils/paymentUtils";

const COL = "appointments";

function normalizeItems(data: DocumentData): ServiceItem[] {
  if (Array.isArray(data.items) && data.items.length > 0) {
    return (data.items as ServiceItem[]).map((it) => ({
      type: (it.type ?? 'otro') as ServiceType,
      label: it.label ?? SERVICE_LABELS[(it.type ?? 'otro') as ServiceType],
      qty: Number(it.qty) || 1,
      unitPrice: Number(it.unitPrice) || 0,
    }))
  }
  const legacyType = (data.serviceType ?? 'otro') as ServiceType
  const legacyPrice = Number(data.price) || 0
  return [{
    type: legacyType,
    label: SERVICE_LABELS[legacyType] ?? SERVICE_LABELS.otro,
    qty: 1,
    unitPrice: legacyPrice,
  }]
}

function toAppointment(snap: DocumentSnapshot): Appointment {
  const data = snap.data()!
  const items = normalizeItems(data)
  const price = items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0)
  const amountPaid = (data.amountPaid as number) ?? 0
  const paymentHistory = (data.paymentHistory as PaymentEntry[]) ?? []
  const paymentStatus = derivePaymentStatus(amountPaid, price)
  return {
    id: snap.id,
    ...data,
    items,
    price,
    amountPaid,
    paymentHistory,
    paymentStatus,
  } as Appointment
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
      const appointments = snap.docs.map((d) => toAppointment(d));
      return ok(appointments);
    } catch {
      return err("No se pudieron cargar las citas.");
    }
  },

  async getById(id: string): Promise<Result<Appointment>> {
    try {
      const snap = await getDoc(doc(db, COL, id));
      if (!snap.exists()) return err("Cita no encontrada.");
      return ok(toAppointment(snap));
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
      return ok(toAppointment(snap));
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
      return ok(toAppointment(snap));
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
      const appointments = snap.docs.map((d) => toAppointment(d));
      callback(appointments);
    });
  },

  subscribeToAll(
    userId: string,
    callback: (appointments: Appointment[]) => void,
  ): Unsubscribe {
    const q = query(collection(db, COL), where("userId", "==", userId));

    return onSnapshot(q, (snap) => {
      const appointments = snap.docs.map((d) => toAppointment(d));
      callback(appointments);
    });
  },

  async addPayment(id: string, entry: PaymentEntry): Promise<Result<Appointment>> {
    try {
      const ref = doc(db, 'appointments', id)
      await updateDoc(ref, {
        paymentHistory: arrayUnion(entry),
        updatedAt: serverTimestamp(),
      })
      const snap = await getDoc(ref)
      if (!snap.exists()) return err('Cita no encontrada.')
      const data = snap.data()
      const history = (data.paymentHistory as PaymentEntry[]) ?? []
      const newAmountPaid = history.reduce((sum, e) => sum + e.amount, 0)
      const computedPrice = normalizeItems(data).reduce((sum, it) => sum + it.qty * it.unitPrice, 0)
      const newStatus = derivePaymentStatus(newAmountPaid, computedPrice)
      await updateDoc(ref, { amountPaid: newAmountPaid, paymentStatus: newStatus })
      const finalSnap = await getDoc(ref)
      return ok(toAppointment(finalSnap))
    } catch {
      return err('No se pudo registrar el pago.')
    }
  },
};
