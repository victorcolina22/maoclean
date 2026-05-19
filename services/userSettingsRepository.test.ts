import { userSettingsRepository } from './userSettingsRepository'
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/domain/entities/userSettings'
import { doc, getDoc, setDoc } from 'firebase/firestore'

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}))

jest.mock('@/services/firebase', () => ({ db: {} }))

const mockedGetDoc = getDoc as jest.MockedFunction<typeof getDoc>
const mockedSetDoc = setDoc as jest.MockedFunction<typeof setDoc>
const mockedDoc = doc as jest.MockedFunction<typeof doc>

beforeEach(() => {
  jest.clearAllMocks()
  mockedDoc.mockReturnValue({} as any)
})

describe('userSettingsRepository.getSettings', () => {
  test('1. missing doc returns DEFAULT', async () => {
    mockedGetDoc.mockResolvedValueOnce({ exists: () => false } as any)

    const result = await userSettingsRepository.getSettings('user-1')

    expect(result).toEqual({
      success: true,
      data: { remindersEnabled: true, remind24h: true, remind1h: true },
    })
  })

  test('2. existing doc returns stored values', async () => {
    const stored = { remindersEnabled: false, remind24h: true, remind1h: false }
    mockedGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => stored,
    } as any)

    const result = await userSettingsRepository.getSettings('user-1')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(stored)
    }
  })

  test('3. partial doc falls back per-field to DEFAULT', async () => {
    mockedGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ remind24h: false }),
    } as any)

    const result = await userSettingsRepository.getSettings('user-1')

    expect(result).toEqual({
      success: true,
      data: { remindersEnabled: true, remind24h: false, remind1h: true },
    })
  })

  test('4. Firestore throws → returns err, does not throw', async () => {
    mockedGetDoc.mockRejectedValueOnce(new Error('network error'))

    const result = await userSettingsRepository.getSettings('user-1')

    expect(result).toEqual({
      success: false,
      error: 'No se pudo cargar la configuración de notificaciones.',
    })
  })
})

describe('userSettingsRepository.saveSettings', () => {
  test('5a. setDoc resolves → success, called with merge: true', async () => {
    mockedSetDoc.mockResolvedValueOnce(undefined)

    const settings = { remindersEnabled: false, remind24h: true, remind1h: false }
    const result = await userSettingsRepository.saveSettings('user-1', settings)

    expect(result).toEqual({ success: true, data: undefined })
    expect(mockedSetDoc).toHaveBeenCalledTimes(1)
    expect(mockedSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      settings,
      { merge: true },
    )
  })

  test('5b. setDoc rejects → returns err', async () => {
    mockedSetDoc.mockRejectedValueOnce(new Error('write failed'))

    const result = await userSettingsRepository.saveSettings('user-1', DEFAULT_NOTIFICATION_SETTINGS)

    expect(result).toEqual({
      success: false,
      error: 'No se pudo guardar la configuración. Intenta de nuevo.',
    })
  })
})
