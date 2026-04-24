import { Client, CreateClientDTO, UpdateClientDTO } from '../entities/client'
import { Result } from '@/utils/result'

export interface IClientRepository {
  getAll(userId: string): Promise<Result<Client[]>>
  getById(id: string): Promise<Result<Client>>
  create(data: CreateClientDTO): Promise<Result<Client>>
  update(id: string, data: UpdateClientDTO): Promise<Result<Client>>
  delete(id: string): Promise<Result<void>>
}
