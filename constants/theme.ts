export const colors = {
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',

  success: '#16A34A',
  warning: '#CA8A04',
  danger: '#DC2626',

  neutral50: '#F9FAFB',
  neutral100: '#F3F4F6',
  neutral200: '#E5E7EB',
  neutral300: '#D1D5DB',
  neutral400: '#9CA3AF',
  neutral500: '#6B7280',
  neutral600: '#4B5563',
  neutral700: '#374151',
  neutral800: '#1F2937',
  neutral900: '#111827',

  white: '#FFFFFF',
  black: '#000000',
} as const

export const STATUS_COLORS = {
  scheduled: colors.primary,
  in_progress: colors.warning,
  completed: colors.success,
  cancelled: colors.neutral400,
  no_show: colors.danger,
} as const

export const PAYMENT_COLORS = {
  pending: colors.warning,
  paid: colors.success,
  partial: colors.primaryLight,
} as const
