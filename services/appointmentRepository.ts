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
  getDocsFromServer,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  DocumentSnapshot,
  DocumentData,
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
import {
  PricingEntry,
  getOrgPricing,
  setPricingEntry,
  deletePricingEntry,
  addPaymentEntry,
  subscribeToOrgPricing,
  mergePricing,
} from "./pricingRepository";

const COL = "appointments";

function normalizeItems(data: DocumentData): ServiceItem[] {
  if (Array.isArray(data.items) && data.items.length > 0) {
    return (data.items as ServiceItem[]).map((it) => ({
      type: (it.type ?? 'otro') as ServiceType,
      label: it.label ?? SERVICE_LABELS[(it.type ?? 'otro') as ServiceType],
      qty: Number(it.qty) || 1,
      // Legacy fallback only: appointments written before the pricing split
      // may still carry unitPrice inline. New/migrated docs don't, and
      // mergePricing() supplies the real value from the pricing entry.
      ...(it.unitPrice !== undefined ? { unitPrice: Number(it.unitPrice) || 0 } : {}),
    }))
  }
  const legacyType = (data.serviceType ?? 'otro') as ServiceType
  return [{
    type: legacyType,
    label: SERVICE_LABELS[legacyType] ?? SERVICE_LABELS.otro,
    qty: 1,
  }]
}

function toAppointment(snap: DocumentSnapshot): Appointment {
  const data = snap.data()!
  const items = normalizeItems(data)
  return {
    id: snap.id,
    ...data,
    items,
  } as Appointment
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  );
}

function toPublicItems(items: ServiceItem[]): Omit<ServiceItem, "unitPrice">[] {
  return items.map(({ type, label, qty }) => ({ type, label, qty }));
}

async function mergeOneWithPricing(ownerId: string, appointment: Appointment): Promise<Appointment> {
  const pricingResult = await getOrgPricing(ownerId);
  if (!pricingResult.success) return appointment;
  return mergePricing(appointment, pricingResult.data[appointment.id]);
}

async function mergeManyWithPricing(ownerId: string, appointments: Appointment[]): Promise<Appointment[]> {
  const pricingResult = await getOrgPricing(ownerId);
  if (!pricingResult.success) return appointments;
  return appointments.map((a) => mergePricing(a, pricingResult.data[a.id]));
}

export const appointmentRepository: IAppointmentRepository = {
  async getByDate(ownerId: string, date: Date): Promise<Result<Appointment[]>> {
    try {
      const start = Timestamp.fromDate(startOfDay(date));
      const end = Timestamp.fromDate(endOfDay(date));

      const q = query(
        collection(db, COL),
        where("ownerId", "==", ownerId),
        where("scheduledAt", ">=", start),
        where("scheduledAt", "<=", end),
      );

      const snap = await getDocs(q);
      const appointments = snap.docs.map((d) => toAppointment(d));
      return ok(await mergeManyWithPricing(ownerId, appointments));
    } catch {
      return err("No se pudieron cargar las citas.");
    }
  },

  async getById(id: string): Promise<Result<Appointment>> {
    try {
      const snap = await getDoc(doc(db, COL, id));
      if (!snap.exists()) return err("Cita no encontrada.");
      const appointment = toAppointment(snap);
      return ok(await mergeOneWithPricing(appointment.ownerId, appointment));
    } catch {
      return err("No se pudo cargar la cita.");
    }
  },

  async create(data: CreateAppointmentDTO): Promise<Result<Appointment>> {
    try {
      const { items, amountPaid, paymentHistory, paymentStatus: _paymentStatus, ...rest } = data;
      const payload = stripUndefined({
        ...rest,
        items: toPublicItems(items),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const ref = await addDoc(collection(db, COL), payload);

      const pricingEntry: PricingEntry = {
        unitPrices: items.map((it) => it.unitPrice ?? 0),
        amountPaid,
        paymentHistory,
      };
      const pricingResult = await setPricingEntry(data.ownerId, ref.id, pricingEntry);
      if (!pricingResult.success) return pricingResult;

      const snap = await getDoc(ref);
      const appointment = toAppointment(snap);
      return ok(mergePricing(appointment, pricingEntry));
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
      const { items, paymentStatus: _paymentStatus, ...rest } = data;
      await updateDoc(
        ref,
        stripUndefined({
          ...rest,
          ...(items ? { items: toPublicItems(items) } : {}),
          updatedAt: serverTimestamp(),
        }),
      );

      if (items) {
        const snap = await getDoc(ref);
        if (!snap.exists()) return err("Cita no encontrada.");
        const ownerId = snap.data().ownerId as string;
        const pricingResult = await getOrgPricing(ownerId);
        const existing = pricingResult.success ? pricingResult.data[id] : undefined;
        const pricingUpdate = await setPricingEntry(ownerId, id, {
          unitPrices: items.map((it) => it.unitPrice ?? 0),
          amountPaid: existing?.amountPaid ?? 0,
          paymentHistory: existing?.paymentHistory ?? [],
        });
        if (!pricingUpdate.success) return pricingUpdate;
      }

      const snap = await getDoc(ref);
      const appointment = toAppointment(snap);
      return ok(await mergeOneWithPricing(appointment.ownerId, appointment));
    } catch {
      return err("No se pudo actualizar la cita.");
    }
  },

  async delete(id: string): Promise<Result<void>> {
    try {
      const snap = await getDoc(doc(db, COL, id));
      const ownerId = snap.exists() ? (snap.data().ownerId as string) : undefined;
      await deleteDoc(doc(db, COL, id));
      if (ownerId) await deletePricingEntry(ownerId, id);
      return ok(undefined);
    } catch {
      return err("No se pudo eliminar la cita.");
    }
  },

  subscribeToDate(
    ownerId: string,
    date: Date,
    callback: (appointments: Appointment[]) => void,
  ): Unsubscribe {
    const start = Timestamp.fromDate(startOfDay(date));
    const end = Timestamp.fromDate(endOfDay(date));

    const q = query(
      collection(db, COL),
      where("ownerId", "==", ownerId),
      where("scheduledAt", ">=", start),
      where("scheduledAt", "<=", end),
    );

    return subscribeWithPricing(ownerId, (emit) =>
      onSnapshot(q, (snap) => emit(snap.docs.map((d) => toAppointment(d)))),
    callback);
  },

  subscribeToAll(
    ownerId: string,
    callback: (appointments: Appointment[]) => void,
  ): Unsubscribe {
    const q = query(collection(db, COL), where("ownerId", "==", ownerId));

    return subscribeWithPricing(ownerId, (emit) =>
      onSnapshot(q, (snap) => emit(snap.docs.map((d) => toAppointment(d)))),
    callback);
  },

  async getAllForUser(ownerId: string): Promise<Result<Appointment[]>> {
    try {
      const q = query(collection(db, COL), where("ownerId", "==", ownerId));
      const snap = await getDocsFromServer(q);
      const appointments = snap.docs.map((d) => toAppointment(d));
      return ok(await mergeManyWithPricing(ownerId, appointments));
    } catch {
      return err("No se pudieron cargar las citas.");
    }
  },

  async addPayment(id: string, entry: PaymentEntry): Promise<Result<Appointment>> {
    try {
      const ref = doc(db, COL, id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return err('Cita no encontrada.');
      const appointment = toAppointment(snap);

      const pricingResult = await getOrgPricing(appointment.ownerId);
      const existing = pricingResult.success ? pricingResult.data[id] : undefined;
      if (!existing) return err('No se encontró la información de pago de esta cita.');

      const updatedEntry = await addPaymentEntry(appointment.ownerId, id, existing, entry);
      if (!updatedEntry.success) return updatedEntry;

      await updateDoc(ref, { updatedAt: serverTimestamp() });
      return ok(mergePricing(appointment, updatedEntry.data));
    } catch {
      return err('No se pudo registrar el pago.')
    }
  },
};

// Combines the appointments query listener with the org pricing listener,
// re-emitting the merged list whenever either side updates. Pricing being
// denied (viewer role) or not yet loaded just means "no pricing merged in
// yet" — never blocks the appointments themselves from showing.
function subscribeWithPricing(
  ownerId: string,
  subscribeAppointments: (emit: (appointments: Appointment[]) => void) => Unsubscribe,
  callback: (appointments: Appointment[]) => void,
): Unsubscribe {
  let latestAppointments: Appointment[] | null = null;
  let latestPricing: Record<string, PricingEntry> = {};

  const emitMerged = () => {
    if (!latestAppointments) return;
    callback(latestAppointments.map((a) => mergePricing(a, latestPricing[a.id])));
  };

  const unsubAppointments = subscribeAppointments((appointments) => {
    latestAppointments = appointments;
    emitMerged();
  });

  const unsubPricing = subscribeToOrgPricing(
    ownerId,
    (pricing) => {
      latestPricing = pricing;
      emitMerged();
    },
    () => {
      latestPricing = {};
      emitMerged();
    },
  );

  return () => {
    unsubAppointments();
    unsubPricing();
  };
}
