import React from 'react'
import { Text, Pressable, Alert, Linking } from 'react-native'
import { formatPhone } from '@/utils/formatUtils'

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.length === 9 ? `56${digits}` : digits
}

interface PhoneLinkProps {
  phone: string
  textClassName?: string
}

export function PhoneLink({ phone, textClassName }: PhoneLinkProps) {
  const e164 = toE164(phone)
  const display = formatPhone(phone)

  const handlePress = () => {
    Alert.alert(display, undefined, [
      {
        text: 'Llamar',
        onPress: () => Linking.openURL(`tel:+${e164}`),
      },
      {
        text: 'Mensaje de texto',
        onPress: () => Linking.openURL(`sms:+${e164}`),
      },
      {
        text: 'Mensaje por WhatsApp',
        onPress: () => Linking.openURL(`https://wa.me/${e164}`),
      },
      {
        text: 'Llamar por WhatsApp',
        onPress: () => Linking.openURL(`whatsapp://call?phone=${e164}`),
      },
      { text: 'Cancelar', style: 'cancel' },
    ], { cancelable: true })
  }

  return (
    <Pressable onPress={handlePress} hitSlop={8}>
      <Text className={textClassName ?? 'text-sm text-primary-600'}>
        {display}
      </Text>
    </Pressable>
  )
}
