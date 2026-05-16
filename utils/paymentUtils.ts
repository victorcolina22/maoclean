import { PaymentStatus } from '@/domain/entities/appointment'

export function derivePaymentStatus(amountPaid: number, price: number): PaymentStatus {
  if (amountPaid <= 0 || price === 0) return 'pending'
  if (amountPaid >= price) return 'paid'
  return 'partial'
}

export function remainingBalance(price: number, amountPaid: number): number {
  return Math.max(0, price - amountPaid)
}
