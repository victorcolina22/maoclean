import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, TextInput, Alert, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '@/stores/useAuthStore'
import { useZonesStore } from '@/stores/useZonesStore'
import { Zone, MAX_ZONES } from '@/domain/entities/zone'
import { ZONE_PALETTE } from '@/constants/zone-colors'
import { ZoneColorPicker } from '@/components/zones/ZoneColorPicker'
import { ZoneCommunePicker } from '@/components/zones/ZoneCommunePicker'
import { ZoneListItem } from '@/components/zones/ZoneListItem'

type Mode = 'list' | 'create' | string // string = zoneId being edited

function firstFreeColor(usedColors: string[]): string {
  return ZONE_PALETTE.find((c) => !usedColors.includes(c)) ?? ZONE_PALETTE[0]
}

function generateId(): string {
  return `zone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export default function ZonasScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const { zones, load, createZone, updateZone, deleteZone } = useZonesStore()

  const [mode, setMode] = useState<Mode>('list')
  const [name, setName] = useState('')
  const [color, setColor] = useState(ZONE_PALETTE[0])
  const [communes, setCommunes] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.uid) load(user.uid)
  }, [user?.uid])

  const usedColors = zones.map((z) => z.color).filter((c) => {
    if (mode === 'list' || mode === 'create') return true
    const editing = zones.find((z) => z.id === mode)
    return c !== editing?.color
  })

  const openCreate = () => {
    if (zones.length >= MAX_ZONES) {
      Alert.alert('Límite alcanzado', `Solo puedes crear hasta ${MAX_ZONES} zonas.`)
      return
    }
    setName('')
    setColor(firstFreeColor(zones.map((z) => z.color)))
    setCommunes([])
    setMode('create')
  }

  const openEdit = (zone: Zone) => {
    setName(zone.name)
    setColor(zone.color)
    setCommunes([...zone.communes])
    setMode(zone.id)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre de la zona es obligatorio.')
      return
    }
    if (!color) {
      Alert.alert('Error', 'Selecciona un color para la zona.')
      return
    }
    if (!user?.uid) return
    setSaving(true)
    if (mode === 'create') {
      await createZone(user.uid, { id: generateId(), name: name.trim(), color, communes })
    } else {
      await updateZone(user.uid, { id: mode, name: name.trim(), color, communes })
    }
    setSaving(false)
    setMode('list')
  }

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar zona', '¿Estás seguro? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (user?.uid) await deleteZone(user.uid, id)
        },
      },
    ])
  }

  if (mode !== 'list') {
    const editingZone = mode !== 'create' ? zones.find((z) => z.id === mode) : undefined
    return (
      <ScrollView
        className="flex-1 bg-neutral-50 px-4"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-base font-semibold text-neutral-900 mb-4">
          {mode === 'create' ? 'Nueva zona' : `Editar: ${editingZone?.name}`}
        </Text>

        <Text className="text-xs font-medium text-neutral-500 uppercase mb-1">Nombre</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ej: Providencia"
          className="bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 mb-4"
        />

        <Text className="text-xs font-medium text-neutral-500 uppercase mb-2">Color</Text>
        <ZoneColorPicker
          selected={color}
          usedColors={zones.filter((z) => z.id !== mode).map((z) => z.color)}
          onChange={setColor}
        />

        <Text className="text-xs font-medium text-neutral-500 uppercase mb-2">Comunas</Text>
        <ZoneCommunePicker
          selected={communes}
          zones={zones}
          currentZoneId={mode !== 'create' ? mode : undefined}
          onChange={setCommunes}
        />

        <View className="flex-row gap-3 mt-2">
          <Pressable
            onPress={() => setMode('list')}
            className="flex-1 py-3 rounded-xl bg-neutral-100 items-center"
          >
            <Text className="text-sm font-semibold text-neutral-700">Cancelar</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            className={`flex-1 py-3 rounded-xl bg-primary-600 items-center ${saving ? 'opacity-50' : ''}`}
          >
            <Text className="text-sm font-semibold text-white">{saving ? 'Guardando…' : 'Guardar'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView
      className="flex-1 bg-neutral-50 px-4"
      contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 24 }}
    >
      <Text className="text-xs text-neutral-500 mb-4">
        Agrupa comunas en zonas para colorear el mapa y organizar rutas. Máximo {MAX_ZONES} zonas.
      </Text>

      {zones.map((zone) => (
        <ZoneListItem
          key={zone.id}
          zone={zone}
          onEdit={() => openEdit(zone)}
          onDelete={() => handleDelete(zone.id)}
        />
      ))}

      {zones.length === 0 && (
        <Text className="text-sm text-neutral-400 text-center mt-8">
          No tienes zonas creadas aún.
        </Text>
      )}

      <Pressable
        onPress={openCreate}
        disabled={zones.length >= MAX_ZONES}
        className={`mt-4 py-3 rounded-xl border border-primary-600 items-center ${zones.length >= MAX_ZONES ? 'opacity-40' : ''}`}
      >
        <Text className="text-primary-600 font-semibold text-sm">+ Agregar zona</Text>
      </Pressable>
    </ScrollView>
  )
}
