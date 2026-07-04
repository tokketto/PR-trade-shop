'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Partner } from '@/lib/partners'

export default function AdminPage() {
  const router = useRouter()
  const [partners, setPartners] = useState<Partner[]>([])
  const [loaded, setLoaded] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const session = sessionStorage.getItem('pr_partner')
    if (!session) { router.push('/'); return }
    const p = JSON.parse(session)
    if (!p.isAdmin) { router.push('/shop'); return }

    fetch('/api/partners')
      .then(r => r.json())
      .then(data => { setPartners(data); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [router])

  async function revoke(code: string) {
    const updated = await fetch('/api/partners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, active: false }),
    }).then(r => r.json())
    setPartners(updated)
  }

  async function restore(code: string) {
    const updated = await fetch('/api/partners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, active: true }),
    }).then(r => r.json())
    setPartners(updated)
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

  function logout() { sessionStorage.removeItem('pr_partner'); router.push('/') }

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
          partner disables their code right away.
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Partner Name</th>
              <th>Access Code</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.code}>
                <td>{p.name}{p.isAdmin && <span style={{fontSize:'0.65rem',color:'var(--gold)',marginLeft:6}}>ADMIN</span>}</td>
                <td><span className="code-pill">{p.code}</span></td>
                <td><span className={p.active ? 'status-active' : 'status-revoked'}>{p.active ? 'Active' : 'Revoked'}</span></td>
                <td>
                  {p.isAdmin ? '—' : p.active
                    ? <button className="action-btn revoke" onClick={() => revoke(p.code)}>Revoke</button>
                    : <button className="action-btn restore" onClick={() => restore(p.code)}>Restore</button>}
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
      </div>

      <footer>&copy; 2026 Consorzio del Formaggio Parmigiano Reggiano — Authorised Trade Partners Only</footer>
    </>
  )
}
