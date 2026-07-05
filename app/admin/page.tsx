'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Partner } from '@/lib/partners'
import type { AccessRequest } from '@/lib/access-requests'

export default function AdminPage() {
  const router = useRouter()
  const [partners, setPartners] = useState<Partner[]>([])
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loaded, setLoaded] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({})
  const [codeDrafts, setCodeDrafts] = useState<Record<string, string>>({})
  const [addressDrafts, setAddressDrafts] = useState<Record<string, string>>({})
  const [contactNameDrafts, setContactNameDrafts] = useState<Record<string, string>>({})
  const [contactEmailDrafts, setContactEmailDrafts] = useState<Record<string, string>>({})
  const [rowSaving, setRowSaving] = useState<Record<string, boolean>>({})

  const [approveCodes, setApproveCodes] = useState<Record<string, string>>({})
  const [approving, setApproving] = useState<Record<string, boolean>>({})
  const [requestErrors, setRequestErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const session = sessionStorage.getItem('pr_partner')
    if (!session) { router.push('/'); return }
    const p = JSON.parse(session)
    if (!p.isAdmin) { router.push('/shop'); return }

    Promise.all([
      fetch('/api/partners').then(r => r.json()),
      fetch('/api/request-access').then(r => r.json()),
    ])
      .then(([partnersData, requestsData]) => {
        setPartners(partnersData)
        setRequests(Array.isArray(requestsData) ? requestsData : [])
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [router])

  async function updatePartner(body: object): Promise<boolean> {
    try {
      const res = await fetch('/api/partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return false }
      setPartners(data)
      setError('')
      return true
    } catch {
      setError('Something went wrong. Please try again.')
      return false
    }
  }

  async function revoke(code: string) {
    await updatePartner({ code, active: false })
  }

  async function restore(code: string) {
    await updatePartner({ code, active: true })
  }

  async function deletePartner(code: string, name: string) {
    const ok = window.confirm(
      `Delete ${name}? This permanently removes their access code, contact info, and shipping address. ` +
      `Past orders stay on file but won't be linked to this partner anymore. This can't be undone.`
    )
    if (!ok) return
    try {
      const res = await fetch('/api/partners', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return }
      setPartners(data)
      setError('')
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  function clearDrafts(code: string) {
    setNameDrafts(prev => { const c = { ...prev }; delete c[code]; return c })
    setCodeDrafts(prev => { const c = { ...prev }; delete c[code]; return c })
    setAddressDrafts(prev => { const c = { ...prev }; delete c[code]; return c })
    setContactNameDrafts(prev => { const c = { ...prev }; delete c[code]; return c })
    setContactEmailDrafts(prev => { const c = { ...prev }; delete c[code]; return c })
  }

  async function saveRow(originalCode: string) {
    const p = partners.find(x => x.code === originalCode)
    if (!p) return
    const name = (nameDrafts[originalCode] ?? p.name).trim()
    const newCode = (codeDrafts[originalCode] ?? p.code).trim()
    const contactName = (contactNameDrafts[originalCode] ?? p.contactName ?? '').trim()
    const contactEmail = (contactEmailDrafts[originalCode] ?? p.contactEmail ?? '').trim()
    const shippingAddress = (addressDrafts[originalCode] ?? p.shippingAddress ?? '').trim()

    if (!name || !newCode) { setError('Partner name and access code cannot be empty.'); return }

    setRowSaving(prev => ({ ...prev, [originalCode]: true }))
    const ok = await updatePartner({ code: originalCode, newCode, name, contactName, contactEmail, shippingAddress })
    if (ok) clearDrafts(originalCode)
    setRowSaving(prev => ({ ...prev, [originalCode]: false }))
  }

  async function addPartner() {
    if (!newName.trim() || !newCode.trim()) { setError('Please enter both a name and a code.'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), code: newCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setSaving(false); return }
      setPartners(data)
      setNewName(''); setNewCode('')
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSaving(false)
  }

  async function approveRequest(id: string) {
    const code = (approveCodes[id] ?? '').trim()
    if (!code) { setRequestErrors(prev => ({ ...prev, [id]: 'Enter a code first.' })); return }
    setApproving(prev => ({ ...prev, [id]: true }))
    setRequestErrors(prev => ({ ...prev, [id]: '' }))
    try {
      const res = await fetch('/api/request-access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRequestErrors(prev => ({ ...prev, [id]: data.error || 'Something went wrong.' }))
      } else {
        setPartners(data.partners)
        setRequests(data.requests)
      }
    } catch {
      setRequestErrors(prev => ({ ...prev, [id]: 'Something went wrong.' }))
    }
    setApproving(prev => ({ ...prev, [id]: false }))
  }

  function logout() {
    fetch('/api/auth', { method: 'DELETE' })
    sessionStorage.removeItem('pr_partner')
    router.push('/')
  }

  const pendingRequests = requests.filter(r => r.status !== 'approved')

  if (!loaded) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--brown)'}}>
      <p style={{color:'var(--gold-light)', fontFamily:'Libre Bodoni, serif', fontSize:'1.2rem', letterSpacing:'0.1em'}}>Loading…</p>
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
        <button className="admin-back" onClick={() => router.push('/shop')}>← View Shop</button>
        <div className="admin-title">Partner Access Manager</div>
        <div className="admin-sub">
          Codes are stored in your database and take effect immediately — no redeploy needed. Revoking a
          partner disables their code right away. Edit a partner&apos;s name or code directly to fix a typo or
          avoid a duplicate, then hit Save. Contact info is filled in automatically when approving an access
          request; shipping address is entered manually. Both appear on order emails.
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Partner Name</th>
              <th>Access Code</th>
              <th>Status</th>
              <th>Contact</th>
              <th>Shipping Address</th>
              <th>Save</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.code}>
                <td>
                  <input className="admin-input" style={{minWidth:130}}
                    value={nameDrafts[p.code] ?? p.name}
                    onChange={e => setNameDrafts(prev => ({ ...prev, [p.code]: e.target.value }))}
                    disabled={p.isAdmin} />
                  {p.isAdmin && <span style={{fontSize:'0.65rem',color:'var(--gold)',marginLeft:6}}>ADMIN</span>}
                </td>
                <td>
                  <input className="admin-input" style={{minWidth:110}}
                    value={codeDrafts[p.code] ?? p.code}
                    onChange={e => setCodeDrafts(prev => ({ ...prev, [p.code]: e.target.value }))}
                    disabled={p.isAdmin} />
                </td>
                <td><span className={p.active ? 'status-active' : 'status-revoked'}>{p.active ? 'Active' : 'Revoked'}</span></td>
                <td>
                  <div style={{display:'flex', flexDirection:'column', gap:'0.3rem', minWidth:170}}>
                    <input className="admin-input" placeholder="Contact name"
                      value={contactNameDrafts[p.code] ?? p.contactName ?? ''}
                      onChange={e => setContactNameDrafts(prev => ({ ...prev, [p.code]: e.target.value }))} />
                    <input className="admin-input" placeholder="Contact email"
                      value={contactEmailDrafts[p.code] ?? p.contactEmail ?? ''}
                      onChange={e => setContactEmailDrafts(prev => ({ ...prev, [p.code]: e.target.value }))} />
                  </div>
                </td>
                <td>
                  <input className="admin-input" style={{minWidth:160}} placeholder="Not on file"
                    value={addressDrafts[p.code] ?? p.shippingAddress ?? ''}
                    onChange={e => setAddressDrafts(prev => ({ ...prev, [p.code]: e.target.value }))} />
                </td>
                <td>
                  <button className="action-btn" onClick={() => saveRow(p.code)} disabled={rowSaving[p.code]}>
                    {rowSaving[p.code] ? '…' : 'Save'}
                  </button>
                </td>
                <td>
                  <div style={{display:'flex', gap:'0.4rem', flexWrap:'wrap'}}>
                    <button className="action-btn" onClick={() => router.push(`/admin/orders/${encodeURIComponent(p.code)}`)}>Orders</button>
                    {!p.isAdmin && (p.active
                      ? <button className="action-btn revoke" onClick={() => revoke(p.code)}>Revoke</button>
                      : <button className="action-btn restore" onClick={() => restore(p.code)}>Restore</button>)}
                    {!p.isAdmin && <button className="action-btn revoke" onClick={() => deletePartner(p.code, p.name)}>Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="add-partner-row">
          <input className="admin-input" placeholder="Partner name" value={newName} onChange={e => setNewName(e.target.value)} />
          <input className="admin-input" placeholder="Access code (e.g. NYC-4471)" value={newCode} onChange={e => setNewCode(e.target.value)} />
          <button className="admin-add-btn" onClick={addPartner} disabled={saving}>{saving ? 'Adding…' : 'Add Partner'}</button>
        </div>
        {error && <div className="login-error">{error}</div>}

        <div className="admin-note">
          New partners can log in with their code as soon as you add them here — there&apos;s nothing else to configure.
        </div>

        <div className="admin-title" style={{fontSize:'1.4rem', marginTop:'3rem'}}>Access Requests</div>
        <div className="admin-sub">
          Submitted from the shop&apos;s &quot;Request Access&quot; form. Enter a code and approve to turn a request
          straight into an active partner (using the company name). Approved requests move off this list once handled.
        </div>

        {pendingRequests.length === 0 ? (
          <div className="admin-note">No pending requests.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Name</th>
                <th>Business Email</th>
                <th>Submitted</th>
                <th>Approve</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.slice().reverse().map((r) => (
                <tr key={r.id}>
                  <td>{r.company}</td>
                  <td>{r.firstName} {r.lastName}</td>
                  <td>{r.email}</td>
                  <td>{new Date(r.submittedAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{display:'flex', gap:'0.4rem', alignItems:'center'}}>
                      <input className="admin-input" style={{minWidth:120}} placeholder="Code"
                        value={approveCodes[r.id] ?? ''}
                        onChange={e => setApproveCodes(prev => ({ ...prev, [r.id]: e.target.value }))} />
                      <button className="action-btn restore" onClick={() => approveRequest(r.id)} disabled={approving[r.id]}>
                        {approving[r.id] ? '…' : 'Approve'}
                      </button>
                    </div>
                    {requestErrors[r.id] && <div style={{color:'#C0392B', fontSize:'0.65rem', marginTop:4}}>{requestErrors[r.id]}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <footer>&copy; 2026 Consorzio del Formaggio Parmigiano Reggiano — Authorised Trade Partners Only</footer>
    </>
  )
}
