import { PaymentStatus } from "@/domain/entities/appointment";

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: "Por cobrar",
  paid: "Pagado",
  partial: "Parcial",
};
