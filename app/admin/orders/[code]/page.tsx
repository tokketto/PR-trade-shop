'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { Partner } from '@/lib/partners'
import type { Order } from '@/lib/orders'
import type { Product } from '@/lib/catalog'

export default function PartnerOrdersPage() {
  const router = useRouter()
  const params = useParams<{ code: string }>()
  const [partner, setPartner] = useState<Partner | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const session = sessionStorage.getItem('pr_partner')
    if (!session) { router.push('/'); return }
    const s = JSON.parse(session)
    if (!s.isAdmin) { router.push('/shop'); return }

    const code = decodeURIComponent(params.code)

    Promise.all([
      fetch('/api/partners').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
    ])
      .then(async ([partners, productsData]: [Partner[], Product[]]) => {
        setProducts(Array.isArray(productsData) ? productsData : [])
        const p = Array.isArray(partners) ? partners.find(x => x.code === code) : undefined
        setPartner(p ?? null)
        if (p) {
          const res = await fetch(`/api/orders?partner=${encodeURIComponent(p.name)}`)
          const data = await res.json()
          setOrders(Array.isArray(data) ? data : [])
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [router, params.code])

  const totals = new Map<string, { name: string; qty: number; value: number }>()
  for (const order of orders) {
    for (const item of order.items) {
      const product = products.find(pr => pr.code === item.code)
      const price = product?.price ?? 0
      const existing = totals.get(item.code) ?? { name: item.name, qty: 0, value: 0 }
      existing.qty += item.qty
      existing.value += item.qty * price
      totals.set(item.code, existing)
    }
  }
  const totalValue = Array.from(totals.values()).reduce((sum, t) => sum + t.value, 0)

  function logout() {
    fetch('/api/auth', { method: 'DELETE' })
    sessionStorage.removeItem('pr_partner')
    router.push('/')
  }

  if (!loaded) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--brown)'}}>
      <p style={{color:'var(--gold-light)', fontFamily:'Libre Bodoni, serif', fontSize:'1.2rem', letterSpacing:'0.1em'}}>Loading…</p>
    </div>
  )

  if (!partner) return (
    <>
      <header>
        <a className="logo" href="/admin">Parmigiano Reggiano <span>Trade Partners</span></a>
      </header>
      <div className="admin-wrap">
        <button className="admin-back" onClick={() => router.push('/admin')}>← Back to Admin</button>
        <div className="admin-title">Partner Not Found</div>
      </div>
    </>
  )

  return (
    <>
      <header>
        <a className="logo" href="/admin">Parmigiano Reggiano <span>Trade Partners</span></a>
        <div className="header-right">
          <span className="partner-name">Admin</span>
          <button className="logout-btn" onClick={logout}>Sign Out</button>
        </div>
      </header>

      <div className="admin-wrap">
        <button className="admin-back" onClick={() => router.push('/admin')}>← Back to Admin</button>
        <div className="admin-title">{partner.name}</div>
        <div className="admin-sub">
          <span className="code-pill">{partner.code}</span> · {orders.length} order{orders.length === 1 ? '' : 's'} on file
        </div>

        <div className="admin-title" style={{fontSize:'1.4rem', marginTop:'2.5rem'}}>Lifetime Totals</div>
        <div className="admin-sub">
          Total quantity ordered per item, with an estimated value based on current pricing.
        </div>

        {totals.size === 0 ? (
          <div className="admin-note">No orders yet.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Total Qty Ordered</th>
                <th>Est. Value</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(totals.entries()).map(([code, t]) => (
                <tr key={code}>
                  <td>{t.name} <span style={{color:'var(--text-light)', fontSize:'1rem'}}>({code})</span></td>
                  <td>{t.qty}</td>
                  <td>${t.value.toFixed(2)}</td>
                </tr>
              ))}
              <tr>
                <td style={{fontWeight:600}}>Total</td>
                <td></td>
                <td style={{fontWeight:600}}>${totalValue.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        )}

        <div className="admin-title" style={{fontSize:'1.4rem', marginTop:'2.5rem'}}>Order History</div>

        {orders.length === 0 ? (
          <div className="admin-note">No orders yet.</div>
        ) : (
          orders.slice().reverse().map(order => (
            <div key={order.id} style={{marginBottom:'1.5rem', background:'var(--white)', border:'1px solid var(--border)', padding:'1.2rem 1.5rem'}}>
              <div style={{fontSize:'1rem', color:'var(--text-light)', marginBottom:'0.8rem', textTransform:'uppercase', letterSpacing:'0.08em'}}>
                {new Date(order.submittedAt).toLocaleString()}
              </div>
              <table className="admin-table">
                <thead>
                  <tr><th>Item</th><th>Code</th><th>Qty</th></tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={i}><td>{item.name}</td><td>{item.code}</td><td>{item.qty}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>

      <footer>&copy; 2026 Consorzio del Formaggio Parmigiano Reggiano — Authorised Trade Partners Only</footer>
    </>
  )
}
