import { ServiceType } from '@/domain/entities/appointment'

export const SERVICE_LABELS: Record<ServiceType, string> = {
  sillas: 'Sillas',
  muebles: 'Muebles',
  alfombra: 'Alfombra',
  apartamento: 'Apartamento',
  casa: 'Casa',
  carro: 'Carro',
  otro: 'Otro',
}

export const SERVICE_LIST: { value: ServiceType; label: string }[] = [
  { value: 'sillas', label: 'Sillas' },
  { value: 'muebles', label: 'Muebles' },
  { value: 'alfombra', label: 'Alfombra' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'carro', label: 'Carro' },
  { value: 'otro', label: 'Otro' },
]
