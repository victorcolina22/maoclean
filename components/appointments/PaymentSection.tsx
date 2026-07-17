import React, { useState } from 'react'
import { View, Text } from 'react-native'
import { Appointment, PaymentEntry } from '@/domain/entities/appointment'
import { remainingBalance } from '@/utils/paymentUtils'
import { formatCLP } from '@/utils/formatUtils'
import { toSantiago } from '@/utils/dateUtils'
import { PaymentBadge } from './PaymentBadge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface PaymentSectionProps {
  appointment: Appointment
  onAddPayment: (amount: number, note?: string) => Promise<void>
  onMarkPaid: () => Promise<void>
}

export function PaymentSection({ appointment, onAddPayment, onMarkPaid }: PaymentSectionProps) {
  const { price, amountPaid, paymentStatus, paymentHistory } = appointment
  // This component is only ever mounted for admin reads, where the
  // repository always merges in pricing data — but the type is honest that
  // it CAN be absent (e.g. a viewer somehow reaching this code path), so
  // bail out rather than rendering with bogus numbers.
  if (price === undefined || amountPaid === undefined || !paymentStatus || !paymentHistory) {
    return null
  }
  const remaining = remainingBalance(price, amountPaid)
  const progressPct = price > 0 ? Math.min(100, (amountPaid / price) * 100) : 0

  const [showForm, setShowForm] = useState(false)
  const [amountInput, setAmountInput] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inputError, setInputError] = useState('')

  const sortedHistory = [...paymentHistory].sort(
    (a, b) => a.paidAt.toMillis() - b.paidAt.toMillis()
  )

  const handleConfirm = async () => {
    const parsed = parseFloat(amountInput)
    if (!amountInput || isNaN(parsed) || parsed <= 0) {
      setInputError('Ingresa un monto válido mayor a 0')
      return
    }
    setInputError('')
    setIsSubmitting(true)
    await onAddPayment(parsed, noteInput.trim() || undefined)
    setIsSubmitting(false)
    setAmountInput('')
    setNoteInput('')
    setShowForm(false)
  }

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm mb-3">
      <Text className="text-base font-semibold text-neutral-900 mb-3">Pagos</Text>

      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-sm text-neutral-500">Total</Text>
        <Text className="text-sm font-medium text-neutral-800">{formatCLP(price)}</Text>
      </View>
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-sm text-neutral-500">Pagado</Text>
        <Text className="text-sm font-medium text-neutral-800">{formatCLP(amountPaid)}</Text>
      </View>
      {remaining > 0 && (
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm text-neutral-500">Saldo pendiente</Text>
          <Text className="text-sm font-semibold text-red-600">{formatCLP(remaining)}</Text>
        </View>
      )}

      <View className="h-2 bg-neutral-100 rounded-full mb-3 overflow-hidden">
        <View
          className="h-2 bg-green-500 rounded-full"
          style={{ width: `${progressPct}%` }}
        />
      </View>

      <View className="mb-3">
        <PaymentBadge status={paymentStatus} />
      </View>

      {sortedHistory.length === 0 ? (
        <Text className="text-xs text-neutral-400 mb-3">Sin pagos registrados</Text>
      ) : (
        <View className="mb-3">
          {sortedHistory.map((entry, i) => (
            <View key={i} className="flex-row justify-between items-start py-1.5 border-b border-neutral-100">
              <View className="flex-1">
                <Text className="text-xs text-neutral-500">
                  {toSantiago(entry.paidAt).format('DD/MM/YYYY HH:mm')}
                </Text>
                {entry.note && (
                  <Text className="text-xs text-neutral-400">{entry.note}</Text>
                )}
              </View>
              <Text className="text-sm font-medium text-neutral-800">{formatCLP(entry.amount)}</Text>
            </View>
          ))}
        </View>
      )}

      {paymentStatus !== 'paid' && (
        <View className="gap-2">
          <Button
            label={showForm ? 'Cancelar' : 'Registrar pago'}
            variant={showForm ? 'secondary' : 'primary'}
            onPress={() => { setShowForm((v) => !v); setInputError('') }}
            fullWidth
          />

          {showForm && (
            <View className="mt-2 gap-2">
              <Input
                label="Monto del abono"
                placeholder="0"
                value={amountInput}
                onChangeText={setAmountInput}
                keyboardType="numeric"
                error={inputError}
              />
              <Input
                label="Nota (opcional)"
                placeholder="Ej. Transferencia, efectivo..."
                value={noteInput}
                onChangeText={setNoteInput}
              />
              <Button
                label="Confirmar pago"
                variant="success"
                onPress={handleConfirm}
                isLoading={isSubmitting}
                fullWidth
              />
            </View>
          )}

          <Button
            label="Marcar como pagado"
            variant="ghost"
            onPress={onMarkPaid}
            fullWidth
          />
        </View>
      )}
    </View>
  )
}
