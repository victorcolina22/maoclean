// TODO(cleanup): one-time migration for the org/roles rollout. Backfills
// `ownerId` on pre-existing appointments (previously the only scoping field
// was `userId`, which now means "who created/edited it") and moves
// price/payment fields out of the appointment document into the org-level
// private pricing document (orgs/{ownerId}/private/pricing) so viewer-role
// accounts can never read them, even with direct Firestore access. Safe to
// delete this file and its call site in app/_layout.tsx once confirmed to
// have run for the (single, pre-existing) owner account — it has no purpose
// after that, since every appointment created from here on is already
// written in the split shape by appointmentRepository.
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  getDocsFromServer,
  query,
  where,
  writeBatch,
  doc,
  deleteField,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { setPricingEntry, PricingEntry } from "./pricingRepository";
import { PaymentEntry } from "@/domain/entities/appointment";

const FLAG_KEY = "orgRolesDataMigration_v1";
const COL = "appointments";

interface LegacyItem {
  type?: string;
  label?: string;
  qty?: number;
  unitPrice?: number;
}

function extractPricing(data: DocumentData): PricingEntry {
  const items = (data.items as LegacyItem[] | undefined) ?? [];
  return {
    unitPrices: items.map((it) => Number(it.unitPrice) || 0),
    amountPaid: Number(data.amountPaid) || 0,
    paymentHistory: (data.paymentHistory as PaymentEntry[] | undefined) ?? [],
  };
}

function stripPricingFromItems(items: LegacyItem[]): Omit<LegacyItem, "unitPrice">[] {
  return items.map(({ type, label, qty }) => ({ type, label, qty }));
}

export async function migrateOwnerAndPricingOnce(ownerUid: string): Promise<void> {
  const alreadyRun = await AsyncStorage.getItem(FLAG_KEY);
  if (alreadyRun) return;

  try {
    // Every appointment predating this migration was created by the single
    // admin account that existed at the time, so ownerId === userId for all
    // of them — this only ever needs to run once, by that same account.
    const q = query(collection(db, COL), where("userId", "==", ownerUid));
    const snap = await getDocsFromServer(q);
    if (snap.empty) {
      await AsyncStorage.setItem(FLAG_KEY, "true");
      return;
    }

    const batch = writeBatch(db);
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      if (data.ownerId) continue; // already migrated

      const pricingEntry = extractPricing(data);
      const pricingResult = await setPricingEntry(ownerUid, docSnap.id, pricingEntry);
      if (!pricingResult.success) {
        throw new Error(`Failed writing pricing entry for ${docSnap.id}`);
      }

      const items = (data.items as LegacyItem[] | undefined) ?? [];
      batch.update(doc(db, COL, docSnap.id), {
        ownerId: ownerUid,
        items: stripPricingFromItems(items),
        amountPaid: deleteField(),
        paymentHistory: deleteField(),
        paymentStatus: deleteField(),
      });
    }
    await batch.commit();

    await AsyncStorage.setItem(FLAG_KEY, "true");
  } catch (e) {
    console.error("[dataModelMigration] migration failed, will retry next login", e);
  }
}
