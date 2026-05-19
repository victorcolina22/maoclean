import { zonesRepository } from './zonesRepository'
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

describe('zonesRepository.getZones', () => {
  test('1. missing doc (exists()=false) returns ok([])', async () => {
    mockedGetDoc.mockResolvedValueOnce({ exists: () => false } as any)

    const result = await zonesRepository.getZones('user-1')

    expect(result).toEqual({ success: true, data: [] })
  })

  test('2. existing doc with valid zones array returns ok(storedZones)', async () => {
    const storedZones = [
      { id: 'z1', name: 'Norte', color: '#2563EB', communes: ['Quilicura', 'Renca'] },
      { id: 'z2', name: 'Sur', color: '#16A34A', communes: ['La Pintana'] },
    ]
    mockedGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ zones: storedZones }),
    } as any)

    const result = await zonesRepository.getZones('user-1')

    expect(result).toEqual({ success: true, data: storedZones })
  })

  test('3. doc with malformed entries: filtered to valid only, capped at MAX_ZONES (8)', async () => {
    const validZone = { id: 'z1', name: 'Zona 1', color: '#2563EB', communes: [] }
    const malformedEntries = [
      null,
      undefined,
      { id: '', name: 'No id', color: '#fff', communes: [] },
      { id: 'z2', name: '', color: '#fff', communes: [] },
      { id: 'z3', name: 'No color', color: '', communes: [] },
      { id: 'z4', name: 'No communes', color: '#fff' },
      'not an object',
      42,
    ]
    const nineValidZones = Array.from({ length: 9 }, (_, i) => ({
      id: `z${i + 10}`,
      name: `Zona ${i + 10}`,
      color: '#2563EB',
      communes: [],
    }))

    mockedGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ zones: [validZone, ...malformedEntries, ...nineValidZones] }),
    } as any)

    const result = await zonesRepository.getZones('user-1')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.length).toBe(8)
      expect(result.data[0]).toEqual(validZone)
      result.data.forEach((z) => {
        expect(typeof z.id).toBe('string')
        expect(z.id.length).toBeGreaterThan(0)
        expect(typeof z.name).toBe('string')
        expect(z.name.length).toBeGreaterThan(0)
        expect(typeof z.color).toBe('string')
        expect(z.color.length).toBeGreaterThan(0)
        expect(Array.isArray(z.communes)).toBe(true)
      })
    }
  })

  test('4. Firestore throws → returns err (Spanish), does not throw', async () => {
    mockedGetDoc.mockRejectedValueOnce(new Error('network error'))

    const result = await zonesRepository.getZones('user-1')

    expect(result).toEqual({
      success: false,
      error: 'No se pudo cargar las zonas.',
    })
  })
})

describe('zonesRepository.saveZones', () => {
  test('5a. success: ok(undefined), setDoc called with { zones: input } and { merge: true }', async () => {
    mockedSetDoc.mockResolvedValueOnce(undefined)

    const zones = [{ id: 'z1', name: 'Norte', color: '#2563EB', communes: ['Quilicura'] }]
    const result = await zonesRepository.saveZones('user-1', zones)

    expect(result).toEqual({ success: true, data: undefined })
    expect(mockedSetDoc).toHaveBeenCalledTimes(1)
    expect(mockedSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      { zones },
      { merge: true },
    )
  })

  test('5b. Firestore throws → returns err (Spanish)', async () => {
    mockedSetDoc.mockRejectedValueOnce(new Error('write failed'))

    const result = await zonesRepository.saveZones('user-1', [])

    expect(result).toEqual({
      success: false,
      error: 'No se pudo guardar las zonas. Intenta de nuevo.',
    })
  })
})
