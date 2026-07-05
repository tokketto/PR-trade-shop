import { NextRequest, NextResponse } from 'next/server'
import { getOrders } from '@/lib/orders'
import { isAdminRequest } from '@/lib/session'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orders = await getOrders()
  const partner = req.nextUrl.searchParams.get('partner')
  const filtered = partner ? orders.filter(o => o.partnerName === partner) : orders

  return NextResponse.json(filtered)
}
