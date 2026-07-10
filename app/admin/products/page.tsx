'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@/lib/catalog'
import { categoryLabels } from '@/lib/catalog'

const CATEGORIES = Object.keys(categoryLabels)

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')

  const [drafts, setDrafts] = useState<Record<string, Partial<Product>>>({})
  const [rowSaving, setRowSaving] = useState<Record<string, boolean>>({})
  const [rowDeleting, setRowDeleting] = useState<Record<string, boolean>>({})

  const [newProduct, setNewProduct] = useState({
    name: '', code: '', sku: '', category: CATEGORIES[0], price: '', qty: '', img: '', priceNote: '', description: '',
    variantGroup: '', variantLabel: '',
  })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const session = sessionStorage.getItem('pr_partner')
    if (!session) { router.push('/'); return }
    const s = JSON.parse(session)
    if (!s.isAdmin) { router.push('/shop'); return }

    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : [])
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [router])

  function draftValue<K extends keyof Product>(p: Product, field: K): Product[K] {
    const draft = drafts[p.sku]
    return draft && field in draft ? (draft[field] as Product[K]) : p[field]
  }

  function setDraft(sku: string, field: keyof Product, value: string | number) {
    setDrafts(prev => ({ ...prev, [sku]: { ...prev[sku], [field]: value } }))
  }

  function clearDraft(sku: string) {
    setDrafts(prev => { const c = { ...prev }; delete c[sku]; return c })
  }

  async function saveRow(sku: string) {
    const p = products.find(x => x.sku === sku)
    if (!p) return
    const draft = drafts[sku] ?? {}
    const body = { sku, ...draft }

    setRowSaving(prev => ({ ...prev, [sku]: true }))
    setError('')
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setRowSaving(prev => ({ ...prev, [sku]: false })); return }
      setProducts(data)
      clearDraft(sku)
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setRowSaving(prev => ({ ...prev, [sku]: false }))
  }

  async function deleteRow(sku: string, name: string) {
    const ok = window.confirm(`Delete ${name}? This permanently removes it from the shop and cannot be undone.`)
    if (!ok) return

    setRowDeleting(prev => ({ ...prev, [sku]: true }))
    setError('')
    try {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setRowDeleting(prev => ({ ...prev, [sku]: false })); return }
      setProducts(data)
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setRowDeleting(prev => ({ ...prev, [sku]: false }))
  }

  async function addProduct() {
    const { name, code, sku, category, price, img } = newProduct
    if (!name.trim() || !code.trim() || !sku.trim() || !price.trim() || !img.trim()) {
      setError('Name, code, SKU, price, and image URL are required.')
      return
    }
    setAdding(true)
    setError('')
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          price: Number(newProduct.price),
          qty: newProduct.qty.trim() ? Number(newProduct.qty) : 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setAdding(false); return }
      setProducts(data)
      setNewProduct({ name: '', code: '', sku: '', category: CATEGORIES[0], price: '', qty: '', img: '', priceNote: '', description: '', variantGroup: '', variantLabel: '' })
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setAdding(false)
  }

  function logout() {
    fetch('/api/auth', { method: 'DELETE' })
    sessionStorage.removeItem('pr_partner')
    router.push('/')
  }

  if (!loaded) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--brown)'}}>
      <p style={{color:'var(--gold-light)', fontFamily:'Baskerville PR, serif', fontSize:'1.2rem', letterSpacing:'0.1em'}}>Loading…</p>
    </div>
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
        <div className="admin-title">Product Manager</div>
        <div className="admin-sub">
          Edit any field and hit Save. SKU is locked once a product is created — it&apos;s the internal identifier
          tied to past inventory history, so it can&apos;t be changed to avoid orphaning records. Give products the
          same Variant Group (e.g. &quot;tshirt&quot;) to merge them into one card in the shop with a size/option
          picker — the Variant Label (e.g. &quot;Small&quot;) is what shows in that picker.
        </div>

        <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Code</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Price Note</th>
              <th>Qty</th>
              <th>Description</th>
              <th>Variant</th>
              <th>Save</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.sku}>
                <td>
                  <input className="admin-input" style={{minWidth:160}} placeholder="Image URL"
                    value={draftValue(p, 'img')}
                    onChange={e => setDraft(p.sku, 'img', e.target.value)} />
                  {draftValue(p, 'img') && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={draftValue(p, 'img')} alt={p.name} style={{width:56, height:56, objectFit:'cover', display:'block', marginTop:'0.4rem'}} />
                  )}
                </td>
                <td>
                  <input className="admin-input" style={{minWidth:150}}
                    value={draftValue(p, 'name')}
                    onChange={e => setDraft(p.sku, 'name', e.target.value)} />
                </td>
                <td>
                  <input className="admin-input" style={{minWidth:100}}
                    value={draftValue(p, 'code')}
                    onChange={e => setDraft(p.sku, 'code', e.target.value)} />
                </td>
                <td><span className="code-pill">{p.sku}</span></td>
                <td>
                  <select className="admin-input" value={draftValue(p, 'category')}
                    onChange={e => setDraft(p.sku, 'category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{categoryLabels[c]}</option>)}
                  </select>
                </td>
                <td>
                  <input className="admin-input" type="number" step="0.01" style={{width:'4.5rem', minWidth:0}}
                    value={draftValue(p, 'price')}
                    onChange={e => setDraft(p.sku, 'price', e.target.value)} />
                </td>
                <td>
                  <input className="admin-input" style={{minWidth:130}} placeholder="e.g. incl. shipping"
                    value={draftValue(p, 'priceNote') ?? ''}
                    onChange={e => setDraft(p.sku, 'priceNote', e.target.value)} />
                </td>
                <td>
                  <input className="admin-input" type="number" style={{width:'5.5rem', minWidth:0}}
                    value={draftValue(p, 'qty')}
                    onChange={e => setDraft(p.sku, 'qty', e.target.value)} />
                </td>
                <td>
                  <textarea className="admin-input" style={{minWidth:180, minHeight:60}}
                    value={draftValue(p, 'description') ?? ''}
                    onChange={e => setDraft(p.sku, 'description', e.target.value)} />
                </td>
                <td>
                  <div style={{display:'flex', flexDirection:'column', gap:'0.3rem', minWidth:130}}>
                    <input className="admin-input" placeholder="Variant group"
                      value={draftValue(p, 'variantGroup') ?? ''}
                      onChange={e => setDraft(p.sku, 'variantGroup', e.target.value)} />
                    <input className="admin-input" placeholder="Variant label"
                      value={draftValue(p, 'variantLabel') ?? ''}
                      onChange={e => setDraft(p.sku, 'variantLabel', e.target.value)} />
                  </div>
                </td>
                <td>
                  <button className="action-btn" onClick={() => saveRow(p.sku)} disabled={rowSaving[p.sku]}>
                    {rowSaving[p.sku] ? '…' : 'Save'}
                  </button>
                </td>
                <td>
                  <button className="action-btn revoke" onClick={() => deleteRow(p.sku, p.name)} disabled={rowDeleting[p.sku]}>
                    {rowDeleting[p.sku] ? '…' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className="admin-title" style={{fontSize:'1.4rem', marginTop:'3rem'}}>Add Product</div>
        <div className="admin-sub">
          Paste an image URL (upload it to Cloudinary or wherever first) — there&apos;s no upload button here.
        </div>

        <div className="add-partner-row">
          <input className="admin-input" placeholder="Name" value={newProduct.name}
            onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))} />
          <input className="admin-input" placeholder="Code (e.g. PR2520)" value={newProduct.code}
            onChange={e => setNewProduct(prev => ({ ...prev, code: e.target.value }))} />
          <input className="admin-input" placeholder="SKU (e.g. Adv_PR2520)" value={newProduct.sku}
            onChange={e => setNewProduct(prev => ({ ...prev, sku: e.target.value }))} />
          <select className="admin-input" value={newProduct.category}
            onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c} value={c}>{categoryLabels[c]}</option>)}
          </select>
          <input className="admin-input" type="number" step="0.01" placeholder="Price" value={newProduct.price}
            onChange={e => setNewProduct(prev => ({ ...prev, price: e.target.value }))} />
          <input className="admin-input" type="number" placeholder="Qty (optional)" value={newProduct.qty}
            onChange={e => setNewProduct(prev => ({ ...prev, qty: e.target.value }))} />
          <input className="admin-input" placeholder="Image URL" value={newProduct.img}
            onChange={e => setNewProduct(prev => ({ ...prev, img: e.target.value }))} />
          <input className="admin-input" placeholder="Price note (optional)" value={newProduct.priceNote}
            onChange={e => setNewProduct(prev => ({ ...prev, priceNote: e.target.value }))} />
          <input className="admin-input" placeholder="Description (optional)" value={newProduct.description}
            onChange={e => setNewProduct(prev => ({ ...prev, description: e.target.value }))} />
          <input className="admin-input" placeholder="Variant group (optional)" value={newProduct.variantGroup}
            onChange={e => setNewProduct(prev => ({ ...prev, variantGroup: e.target.value }))} />
          <input className="admin-input" placeholder="Variant label (optional)" value={newProduct.variantLabel}
            onChange={e => setNewProduct(prev => ({ ...prev, variantLabel: e.target.value }))} />
          <button className="admin-add-btn" onClick={addProduct} disabled={adding}>{adding ? 'Adding…' : 'Add Product'}</button>
        </div>
        {error && <div className="login-error">{error}</div>}
      </div>

      <footer>&copy; 2026 Consorzio del Formaggio Parmigiano Reggiano — Authorised Trade Partners Only</footer>
    </>
  )
}
