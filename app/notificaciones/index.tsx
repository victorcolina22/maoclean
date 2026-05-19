import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Switch, ActivityIndicator } from 'react-native'
import { useAuthStore } from '@/stores/useAuthStore'
import { useAllAppointments } from '@/hooks/useAppointments'
import { userSettingsRepository } from '@/services/userSettingsRepository'
import { DEFAULT_NOTIFICATION_SETTINGS, UserNotificationSettings } from '@/domain/entities/userSettings'
import {
  scheduleAppointmentReminder,
  cancelAppointmentReminders,
  cancelAllAppointmentReminders,
} from '@/services/notificationService'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'

function SettingRow({
  label,
  value,
  onValueChange,
  disabled,
}: {
  label: string
  value: boolean
  onValueChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <View
      className={`flex-row items-center justify-between py-4 border-b border-neutral-100 ${disabled ? 'opacity-40' : ''}`}
    >
      <Text className="text-base text-neutral-800 flex-1 pr-4">{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#D4D4D4', true: '#2563EB' }}
        thumbColor="#FFFFFF"
      />
    </View>
  )
}

export default function NotificacionesScreen() {
  const { user } = useAuthStore()
  const { appointments } = useAllAppointments()
  const [settings, setSettings] = useState<UserNotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS)
  const [isFetching, setIsFetching] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{
    visible: boolean
    message: string
    type: 'success' | 'error'
  }>({ visible: false, message: '', type: 'success' })

  useEffect(() => {
    if (!user?.uid) {
      setIsFetching(false)
      return
    }
    userSettingsRepository.getSettings(user.uid).then((r) => {
      if (r.success) setSettings(r.data)
      setIsFetching(false)
    })
  }, [user?.uid])

  const setField = (key: keyof UserNotificationSettings) => (value: boolean) =>
    setSettings((prev) => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    if (!user?.uid) return
    setIsSaving(true)

    const saveResult = await userSettingsRepository.saveSettings(user.uid, settings)
    if (!saveResult.success) {
      setToast({ visible: true, message: saveResult.error, type: 'error' })
      setIsSaving(false)
      return
    }

    try {
      if (!settings.remindersEnabled) {
        await cancelAllAppointmentReminders()
      } else {
        const now = new Date()
        const upcoming = appointments.filter(
          (a) =>
            a.status !== 'cancelled' &&
            a.status !== 'no_show' &&
            a.scheduledAt.toDate() > now,
        )
        for (const appt of upcoming) {
          await cancelAppointmentReminders(appt.id)
          await scheduleAppointmentReminder(appt, settings)
        }
      }
      setToast({ visible: true, message: 'Configuración guardada', type: 'success' })
    } catch {
      setToast({
        visible: true,
        message: 'Guardado. Algunos recordatorios se actualizarán más tarde.',
        type: 'success',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isFetching) return <ActivityIndicator style={{ flex: 1 }} />

  return (
    <View className="flex-1 bg-neutral-50">
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
      >
        <View className="bg-white rounded-2xl border border-neutral-100 px-4 mb-6">
          <Text className="text-base font-semibold text-neutral-900 pt-4 pb-1">
            Recordatorios de citas
          </Text>
          <Text className="text-sm text-neutral-500 pb-3">
            Activa avisos automáticos antes de cada servicio.
          </Text>
          <SettingRow
            label="Recibir recordatorios"
            value={settings.remindersEnabled}
            onValueChange={setField('remindersEnabled')}
            disabled={isSaving}
          />
          <SettingRow
            label="Aviso 24 horas antes"
            value={settings.remind24h}
            onValueChange={setField('remind24h')}
            disabled={isSaving || !settings.remindersEnabled}
          />
          <SettingRow
            label="Aviso 1 hora antes"
            value={settings.remind1h}
            onValueChange={setField('remind1h')}
            disabled={isSaving || !settings.remindersEnabled}
          />
        </View>

        <Button
          label="Guardar"
          onPress={handleSave}
          isLoading={isSaving}
          disabled={isSaving}
          fullWidth
        />
      </ScrollView>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
      />
    </View>
  )
}
