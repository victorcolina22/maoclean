import {
  doc,
  getDoc,
  setDoc,
  deleteField,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  FirestoreError,
} from "firebase/firestore";
import { db } from "./firebase";
import { Appointment, PaymentEntry, ServiceItem } from "@/domain/entities/appointment";
import { derivePaymentStatus } from "@/utils/paymentUtils";
import { Result, ok, err } from "@/utils/result";

// Pricing/payment data lives in ONE document per business
// (orgs/{ownerId}/private/pricing), keyed by appointment id, instead of a
// subcollection per appointment. A viewer-role account is denied read access
// to this whole document by firestore.rules — real field-level security,
// without needing a separate live listener per appointment in list views.
//
// Scaling note: a single Firestore document is capped at 1MB. For a
// small business this comfortably holds many thousands of appointments'
// pricing entries; if that's ever a real constraint, shard by year
// (orgs/{ownerId}/private/pricing_2027) rather than redesigning this.
export interface PricingEntry {
  unitPrices: number[]; // aligned by index with the appointment's items[]
  amountPaid: number;
  paymentHistory: PaymentEntry[];
}

type PricingMap = Record<string, PricingEntry>;

function pricingDoc(ownerId: string) {
  return doc(db, "orgs", ownerId, "private", "pricing");
}

export function subscribeToOrgPricing(
  ownerId: string,
  callback: (pricing: PricingMap) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    pricingDoc(ownerId),
    (snap) => callback((snap.data() as PricingMap) ?? {}),
    onError,
  );
}

export async function getOrgPricing(ownerId: string): Promise<Result<PricingMap>> {
  try {
    const snap = await getDoc(pricingDoc(ownerId));
    return ok((snap.data() as PricingMap) ?? {});
  } catch {
    // Denied for a viewer (or the doc doesn't exist yet) — treat as "no
    // pricing visible" rather than a hard failure.
    return ok({});
  }
}

export async function setPricingEntry(
  ownerId: string,
  appointmentId: string,
  entry: PricingEntry,
): Promise<Result<void>> {
  try {
    await setDoc(
      pricingDoc(ownerId),
      { [appointmentId]: entry, updatedAt: serverTimestamp() },
      { merge: true },
    );
    return ok(undefined);
  } catch {
    return err("No se pudo guardar la información de pago.");
  }
}

export async function deletePricingEntry(
  ownerId: string,
  appointmentId: string,
): Promise<Result<void>> {
  try {
    await setDoc(
      pricingDoc(ownerId),
      { [appointmentId]: deleteField() },
      { merge: true },
    );
    return ok(undefined);
  } catch {
    return err("No se pudo eliminar la información de pago.");
  }
}

export async function addPaymentEntry(
  ownerId: string,
  appointmentId: string,
  existing: PricingEntry,
  entry: PaymentEntry,
): Promise<Result<PricingEntry>> {
  const updated: PricingEntry = {
    ...existing,
    amountPaid: existing.amountPaid + entry.amount,
    paymentHistory: [...existing.paymentHistory, entry],
  };
  const result = await setPricingEntry(ownerId, appointmentId, updated);
  if (!result.success) return result;
  return ok(updated);
}

// Merges a pricing entry into a public (pricing-stripped) appointment,
// producing the full shape the UI expects. Returns the appointment
// unchanged (pricing fields stay undefined) when no entry is available —
// this is what a viewer-role read ends up with, since it never gets a
// PricingEntry to merge in the first place.
export function mergePricing(
  appointment: Appointment,
  entry: PricingEntry | undefined,
): Appointment {
  if (!entry) return appointment;

  const items: ServiceItem[] = appointment.items.map((item, i) => ({
    ...item,
    unitPrice: entry.unitPrices[i] ?? 0,
  }));
  const price = items.reduce((sum, it) => sum + it.qty * (it.unitPrice ?? 0), 0);

  return {
    ...appointment,
    items,
    amountPaid: entry.amountPaid,
    paymentHistory: entry.paymentHistory,
    price,
    paymentStatus: derivePaymentStatus(entry.amountPaid, price),
  };
}
