import { randomUUID } from 'crypto'
import { kvGetString, kvSetString } from './kv'

export type OrderItem = { name: string; code: string; qty: number }

export type Order = {
  id: string
  partnerName: string
  items: OrderItem[]
  submittedAt: string
}

const ORDERS_KEY = 'orders'

export async function getOrders(): Promise<Order[]> {
  try {
    const raw = await kvGetString(ORDERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('Orders KV error:', err)
    return []
  }
}

export async function addOrder(entry: { partnerName: string; items: OrderItem[] }): Promise<void> {
  const existing = await getOrders()
  const newOrder: Order = { ...entry, id: randomUUID(), submittedAt: new Date().toISOString() }
  await kvSetString(ORDERS_KEY, JSON.stringify([...existing, newOrder]))
}
