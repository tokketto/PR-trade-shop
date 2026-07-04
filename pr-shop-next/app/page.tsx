'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin() {
    if (!code.trim()) { setError('Please enter your access code.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      if (!res.ok) { setError('Invalid or revoked access code. Please contact us.'); setLoading(false); return }
      const data = await res.json()
      // Store only name and role — never the code
      sessionStorage.setItem('pr_partner', JSON.stringify({ name: data.name, isAdmin: data.isAdmin }))
      router.push(data.isAdmin ? '/admin' : '/shop')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <header>
        <a className="logo" href="/"><span style={{color:'var(--gold-light)'}}>Parmigiano Reggiano</span> <span>Trade Partners</span></a>
      </header>
      <div className="login-screen">
        <div className="login-box">
          <div className="login-eyebrow">Trade Partners Only</div>
          <div className="login-title">Welcome</div>
          <div className="login-rule" style={{width:40,height:1,background:'var(--gold)',margin:'0 auto 2rem'}}></div>
          <div className="login-subtitle">This shop is reserved for authorised trade partners. Please enter your unique access code to continue.</div>
          <label className="login-label" htmlFor="code">Access Code</label>
          <input
            className={`login-input${error ? ' error' : ''}`}
            id="code" type="password" placeholder="Enter your code"
            value={code} onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoComplete="off"
          />
          <div className="login-error">{error}</div>
          <button className="login-btn" onClick={handleLogin} disabled={loading}>
            {loading ? 'Checking…' : 'Enter Shop →'}
          </button>
          <div className="login-footer">
            Don&apos;t have an access code?<br />
            Contact us at <a href="mailto:trade@parmigianoreggiano.com">trade@parmigianoreggiano.com</a>
          </div>
        </div>
      </div>
      <footer>&copy; 2026 Consorzio del Formaggio Parmigiano Reggiano — Authorised Trade Partners Only</footer>
    </>
  )
}
