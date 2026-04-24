import { useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useClientsStore } from '@/stores/useClientsStore'
import { clientRepository } from '@/services/clientRepository'
import { CreateClientDTO, UpdateClientDTO } from '@/domain/entities/client'

export function useClients() {
  const { user } = useAuthStore()
  const { clients, isLoading, error, setClients, setLoading, setError } = useClientsStore()

  useEffect(() => {
    if (!user) return

    setLoading(true)
    clientRepository.getAll(user.uid).then((result) => {
      if (result.success) setClients(result.data)
      else setError(result.error)
      setLoading(false)
    })
  }, [user])

  const create = useCallback(
    async (data: Omit<CreateClientDTO, 'userId'>) => {
      if (!user) return { success: false as const, error: 'No autenticado' }
      const result = await clientRepository.create({ ...data, userId: user.uid })
      if (!result.success) setError(result.error)
      return result
    },
    [user]
  )

  const update = useCallback(async (id: string, data: UpdateClientDTO) => {
    const result = await clientRepository.update(id, data)
    if (!result.success) setError(result.error)
    return result
  }, [])

  const remove = useCallback(async (id: string) => {
    const result = await clientRepository.delete(id)
    if (!result.success) setError(result.error)
    return result
  }, [])

  return { clients, isLoading, error, create, update, remove }
}
