'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { products, categoryLabels, type Product } from '@/lib/products'

type CartItem = { qty: number }

export default function ShopPage() {
  const router = useRouter()
  const [partnerName, setPartnerName] = useState('')
  const [filter, setFilter] = useState('all')
  const [cart, setCart] = useState<Record<string, CartItem>>({})
  const [qtys, setQtys] = useState<Record<string, number>>({})
  const [orderSent, setOrderSent] = useState(false)
  const [orderSending, setOrderSending] = useState(false)
  const [inventory, setInventory] = useState<Record<string, number>>({})
  const [invLoaded, setInvLoaded] = useState(false)

  useEffect(() => {
    const session = sessionStorage.getItem('pr_partner')
    if (!session) { router.push('/'); return }
    const p = JSON.parse(session)
    setPartnerName(p.name)

    // Load live inventory from KV
    fetch('/api/inventory')
      .then(r => r.json())
      .then(data => {
        setInventory(data)
        setInvLoaded(true)
      })
      .catch(() => setInvLoaded(true))
  }, [router])

  // Merge KV inventory with product defaults
  const productsWithQty = products.map(p => ({
    ...p,
    qty: inventory[p.sku] !== undefined ? inventory[p.sku] : p.qty,
  }))

  function logout() {
    sessionStorage.removeItem('pr_partner')
    router.push('/')
  }

  const filtered = filter === 'all' ? productsWithQty : productsWithQty.filter(p => p.category === filter)

  function setQty(sku: string, val: number) {
    setQtys(prev => ({ ...prev, [sku]: val }))
  }

  function addToCart(p: Product & { qty: number }) {
    const qty = qtys[p.sku] ?? 1
    if (qty <= 0 || qty > p.qty) return
    setCart(prev => ({ ...prev, [p.sku]: { qty } }))
  }

  function clearCart() { setCart({}) }

  const cartItems = Object.entries(cart).filter(([, v]) => v.qty > 0)
  const cartCount = cartItems.length

  async function submitOrder() {
    setOrderSending(true)
    const items = cartItems.map(([sku, v]) => {
      const p = productsWithQty.find(x => x.sku === sku)
      return p ? { name: p.name, code: p.code, qty: v.qty } : null
    }).filter(Boolean)

    try {
      await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerName, items }),
      })
      setCart({})
      // Refresh inventory after order
      const updated = await fetch('/api/inventory').then(r => r.json())
      setInventory(updated)
      setOrderSent(true)
    } catch {
      alert('Something went wrong. Please try again.')
    }
    setOrderSending(false)
  }

  if (!partnerName || !invLoaded) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--brown)'}}>
      <p style={{color:'var(--gold-light)', fontFamily:'Cormorant Garamond, serif', fontSize:'1.2rem', letterSpacing:'0.1em'}}>Loading…</p>
    </div>
  )

  if (orderSent) return (
    <>
      <header>
        <a className="logo" href="/shop">Parmigiano Reggiano <span>Trade Partners</span></a>
        <div className="header-right">
          <span className="partner-name">{partnerName}</span>
          <button className="logout-btn" onClick={logout}>Sign Out</button>
        </div>
      </header>
      <div style={{minHeight:'calc(100vh - 72px)', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--brown)'}}>
        <div style={{background:'var(--cream)', padding:'3.5rem', maxWidth:'480px', width:'90%', textAlign:'center', borderTop:'3px solid var(--gold)'}}>
          <div style={{fontSize:'0.65rem', letterSpacing:'0.28em', textTransform:'uppercase', color:'var(--gold)', marginBottom:'1.2rem'}}>Order Received</div>
          <div style={{fontFamily:'Cormorant Garamond, serif', fontSize:'2rem', fontWeight:300, color:'var(--brown)', marginBottom:'1rem'}}>Thank you, {partnerName}</div>
          <div style={{width:40, height:1, background:'var(--gold)', margin:'0 auto 1.5rem'}}></div>
          <p style={{fontSize:'0.85rem', color:'var(--text-light)', lineHeight:1.7, marginBottom:'2rem'}}>
            Your order has been submitted for review. You will receive a direct email with a confirmation and a payment link shortly.
          </p>
          <button className="login-btn" onClick={() => setOrderSent(false)} style={{width:'100%'}}>
            Place Another Order
          </button>
        </div>
      </div>
      <footer>&copy; 2026 Consorzio del Formaggio Parmigiano Reggiano — Authorised Trade Partners Only</footer>
    </>
  )

  return (
    <>
      <header>
        <a className="logo" href="/shop">Parmigiano Reggiano <span>Trade Partners</span></a>
        <div className="header-right">
          <span className="partner-name">{partnerName}</span>
          <button className="logout-btn" onClick={logout}>Sign Out</button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-eyebrow">Official Trade Merchandise</div>
        <h1>The <em>Art</em> of<br />Parmigiano Reggiano</h1>
        <div className="hero-rule"></div>
        <p>Professional tools, display materials, and branded merchandise for retailers and trade partners.</p>
        <div className="hero-partner">Welcome, {partnerName}</div>
      </section>

      <div className="filter-bar">
        {['all','apparel','knives','display','accessories'].map(f => (
          <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All Items' : categoryLabels[f]}
          </button>
        ))}
      </div>

      <main className="shop-main">
        <div className="section-label">Trade Collection</div>
        <div className="section-title">Available Inventory</div>
        <div className="product-grid">
          {filtered.map(p => {
            const isLow = p.qty <= 10
            const isOut = p.qty === 0
            const qty = qtys[p.sku] ?? 1
            return (
              <div className="product-card" key={p.sku}>
                <div className="product-img-wrap">
                  <Image src={p.img} alt={p.name} fill style={{objectFit:'cover'}} sizes="(max-width:600px) 100vw, 33vw" />
                </div>
                <div className="card-body">
                  <div className="product-category-tag">{categoryLabels[p.category]}</div>
                  <div className="product-name">{p.name}</div>
                  <div className="product-code">{p.code} · {p.sku}</div>
                  {p.price && <div className="product-price">{p.price}</div>}
                  <div className="stock-row">
                    <span className={`stock-badge ${isLow ? 'low-stock' : 'in-stock'}`}>
                      {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                    </span>
                    <span className="stock-qty">{p.qty.toLocaleString()} available</span>
                  </div>
                  <div className="qty-input-row">
                    <span className="qty-label">Qty</span>
                    <input className="qty-input" type="number" min={0} max={p.qty}
                      value={qty} onChange={e => setQty(p.sku, parseInt(e.target.value) || 0)}
                      disabled={isOut} />
                  </div>
                  <button className="add-btn" onClick={() => addToCart(p)} disabled={isOut}>
                    {isOut ? 'Unavailable' : 'Add to Order'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {cartCount > 0 && (
        <div className="cart-bar">
          <div className="cart-info">
            <strong>{cartCount}</strong> items selected
            <div className="cart-items-list">
              {cartItems.map(([sku, v]) => {
                const p = productsWithQty.find(x => x.sku === sku)
                return p ? `${p.code} ×${v.qty}` : ''
              }).join('  ·  ')}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <button className="clear-btn" onClick={clearCart}>Clear</button>
            <button className="checkout-btn" onClick={submitOrder} disabled={orderSending}>
              {orderSending ? 'Sending…' : 'Submit Order →'}
            </button>
          </div>
        </div>
      )}

      <footer>&copy; 2026 Consorzio del Formaggio Parmigiano Reggiano — Authorised Trade Partners Only</footer>
    </>
  )
}
