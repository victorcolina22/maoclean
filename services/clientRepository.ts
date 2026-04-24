import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { Client, CreateClientDTO, UpdateClientDTO } from '@/domain/entities/client'
import { IClientRepository } from '@/domain/interfaces/IClientRepository'
import { Result, ok, err } from '@/utils/result'

const COL = 'clients'

function toClient(id: string, data: Record<string, unknown>): Client {
  return { id, ...data } as Client
}

export const clientRepository: IClientRepository = {
  async getAll(userId: string): Promise<Result<Client[]>> {
    try {
      const q = query(collection(db, COL), where('userId', '==', userId))
      const snap = await getDocs(q)
      const clients = snap.docs.map((d) => toClient(d.id, d.data()))
      return ok(clients)
    } catch {
      return err('No se pudieron cargar los clientes.')
    }
  },

  async getById(id: string): Promise<Result<Client>> {
    try {
      const snap = await getDoc(doc(db, COL, id))
      if (!snap.exists()) return err('Cliente no encontrado.')
      return ok(toClient(snap.id, snap.data()))
    } catch {
      return err('No se pudo cargar el cliente.')
    }
  },

  async create(data: CreateClientDTO): Promise<Result<Client>> {
    try {
      const payload = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      const ref = await addDoc(collection(db, COL), payload)
      const snap = await getDoc(ref)
      return ok(toClient(snap.id, snap.data()!))
    } catch {
      return err('No se pudo crear el cliente. Intenta de nuevo.')
    }
  },

  async update(id: string, data: UpdateClientDTO): Promise<Result<Client>> {
    try {
      const ref = doc(db, COL, id)
      await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
      const snap = await getDoc(ref)
      return ok(toClient(snap.id, snap.data()!))
    } catch {
      return err('No se pudo actualizar el cliente.')
    }
  },

  async delete(id: string): Promise<Result<void>> {
    try {
      await deleteDoc(doc(db, COL, id))
      return ok(undefined)
    } catch {
      return err('No se pudo eliminar el cliente.')
    }
  },
}
