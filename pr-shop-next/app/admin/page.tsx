'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Partner = { name: string; code: string; active: boolean; isAdmin?: boolean }

export default function AdminPage() {
  const router = useRouter()
  const [partners, setPartners] = useState<Partner[]>([])
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')

  useEffect(() => {
    const session = sessionStorage.getItem('pr_partner')
    if (!session) { router.push('/'); return }
    const p = JSON.parse(session)
    if (!p.isAdmin) { router.push('/shop'); return }
    // Load partners from localStorage (admin-only UI state)
    const stored = localStorage.getItem('pr_admin_partners')
    if (stored) { setPartners(JSON.parse(stored)) }
    else {
      const defaults: Partner[] = [
        { name: 'Milano Foods', code: 'MIL-****', active: true },
        { name: 'Roma Distributors', code: 'ROM-****', active: true },
        { name: 'Bella Italia NYC', code: 'BIT-****', active: true },
        { name: 'Admin', code: 'ADMIN-****', active: true, isAdmin: true },
      ]
      setPartners(defaults)
      localStorage.setItem('pr_admin_partners', JSON.stringify(defaults))
    }
  }, [router])

  function save(updated: Partner[]) {
    setPartners(updated)
    localStorage.setItem('pr_admin_partners', JSON.stringify(updated))
  }

  function revoke(i: number) { const p = [...partners]; p[i].active = false; save(p) }
  function restore(i: number) { const p = [...partners]; p[i].active = true; save(p) }

  function addPartner() {
    if (!newName.trim() || !newCode.trim()) { alert('Please enter both a name and a code.'); return }
    save([...partners, { name: newName.trim(), code: newCode.trim(), active: true }])
    setNewName(''); setNewCode('')
  }

  function logout() { sessionStorage.removeItem('pr_partner'); router.push('/') }

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
          Codes are stored in your Vercel environment variable <code>PARTNER_CODES</code> — never visible in source.
          This panel tracks partner status locally. To add or change a code, update the env variable in Vercel and redeploy.
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Partner Name</th>
              <th>Code (masked)</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p, i) => (
              <tr key={i}>
                <td>{p.name}{p.isAdmin && <span style={{fontSize:'0.65rem',color:'var(--gold)',marginLeft:6}}>ADMIN</span>}</td>
                <td><span className="code-pill">{p.code}</span></td>
                <td><span className={p.active ? 'status-active' : 'status-revoked'}>{p.active ? 'Active' : 'Revoked'}</span></td>
                <td>
                  {p.isAdmin ? '—' : p.active
                    ? <button className="action-btn revoke" onClick={() => revoke(i)}>Revoke</button>
                    : <button className="action-btn restore" onClick={() => restore(i)}>Restore</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="add-partner-row">
          <input className="admin-input" placeholder="Partner name" value={newName} onChange={e => setNewName(e.target.value)} />
          <input className="admin-input" placeholder="Masked label (e.g. NYC-****)" value={newCode} onChange={e => setNewCode(e.target.value)} />
          <button className="admin-add-btn" onClick={addPartner}>Add Row</button>
        </div>

        <div className="admin-note">
          <strong>To add a real partner:</strong> Add their name and code to the <code>PARTNER_CODES</code> env variable in your Vercel dashboard, then redeploy. The code column here shows masked labels only — actual codes never appear in the browser.
        </div>
      </div>

      <footer>&copy; 2026 Consorzio del Formaggio Parmigiano Reggiano — Authorised Trade Partners Only</footer>
    </>
  )
}
