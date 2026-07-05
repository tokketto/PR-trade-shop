'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const [view, setView] = useState<'login' | 'request'>('login')
  const [company, setCompany] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [requestError, setRequestError] = useState('')
  const [requestLoading, setRequestLoading] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  async function handleRequestAccess() {
    if (!company.trim() || !firstName.trim() || !lastName.trim() || !email.trim()) {
      setRequestError('Please fill in all fields.')
      return
    }
    setRequestLoading(true)
    setRequestError('')
    try {
      const res = await fetch('/api/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: company.trim(), firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() }),
      })
      if (!res.ok) { setRequestError('Something went wrong. Please try again.'); setRequestLoading(false); return }
      setRequestSent(true)
    } catch {
      setRequestError('Something went wrong. Please try again.')
    }
    setRequestLoading(false)
  }

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
        <a className="logo" href="/">Parmigiano Reggiano <span>Trade Partners</span></a>
      </header>
      <div className="login-screen">
        <div className="login-box">
          {view === 'login' ? (
            <>
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
                <button type="button" className="login-link-btn" onClick={() => setView('request')}>Request Access</button>
              </div>
            </>
          ) : requestSent ? (
            <>
              <div className="login-eyebrow">Trade Partners Only</div>
              <div className="login-title">Request Sent</div>
              <div className="login-rule" style={{width:40,height:1,background:'var(--gold)',margin:'0 auto 2rem'}}></div>
              <div className="login-subtitle">Thank you. Our team will review your request and be in touch shortly.</div>
              <button type="button" className="login-link-btn" onClick={() => { setView('login'); setRequestSent(false) }}>← Back to Login</button>
            </>
          ) : (
            <>
              <div className="login-eyebrow">Trade Partners Only</div>
              <div className="login-title">Request Access</div>
              <div className="login-rule" style={{width:40,height:1,background:'var(--gold)',margin:'0 auto 2rem'}}></div>
              <div className="login-subtitle">Tell us about your business and we&apos;ll set you up with an access code.</div>
              <label className="login-label" htmlFor="company">Company Name</label>
              <input className="login-input" id="company" type="text" placeholder="Your company"
                value={company} onChange={e => setCompany(e.target.value)} autoComplete="organization" />
              <label className="login-label" htmlFor="firstName">First Name</label>
              <input className="login-input" id="firstName" type="text" placeholder="First name"
                value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" />
              <label className="login-label" htmlFor="lastName">Last Name</label>
              <input className="login-input" id="lastName" type="text" placeholder="Last name"
                value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" />
              <label className="login-label" htmlFor="email">Business Email</label>
              <input className={`login-input${requestError ? ' error' : ''}`} id="email" type="email" placeholder="you@company.com"
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRequestAccess()} autoComplete="email" />
              <div className="login-error">{requestError}</div>
              <button className="login-btn" onClick={handleRequestAccess} disabled={requestLoading}>
                {requestLoading ? 'Sending…' : 'Submit Request →'}
              </button>
              <div className="login-footer">
                <button type="button" className="login-link-btn" onClick={() => setView('login')}>← Back to Login</button>
              </div>
            </>
          )}
        </div>
      </div>
      <footer>&copy; 2026 Consorzio del Formaggio Parmigiano Reggiano — Authorised Trade Partners Only</footer>
    </>
  )
}
