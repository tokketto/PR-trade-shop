import { NextRequest, NextResponse } from 'next/server'
import { addAccessRequest, getAccessRequests } from '@/lib/access-requests'
import { isAdminRequest } from '@/lib/session'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const requests = await getAccessRequests()
  return NextResponse.json(requests)
}

export async function POST(req: NextRequest) {
  const { company, firstName, lastName, email } = await req.json()

  if (!company?.trim() || !firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Please fill in all fields.' }, { status: 400 })
  }

  try {
    await addAccessRequest({ company: company.trim(), firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() })
  } catch (err) {
    console.error('Failed to persist access request:', err)
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
  }

  const requestHtml = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #2C1F14;">
      <div style="background: #3D2B1F; padding: 2rem; text-align: center; border-bottom: 2px solid #B8963E;">
        <h1 style="color: #D4AF5A; font-size: 1.4rem; font-weight: 400; letter-spacing: 0.15em; text-transform: uppercase; margin: 0;">
          Parmigiano Reggiano
        </h1>
        <p style="color: #EDE5D0; font-size: 0.8rem; margin: 0.5rem 0 0; letter-spacing: 0.1em;">New Access Request</p>
      </div>
      <div style="padding: 2rem; background: #F7F2E8;">
        <p style="font-size: 0.9rem; color: #6B4C38; margin-bottom: 1.5rem;">
          A trade partner has requested shop access.
        </p>
        <table style="width: 100%; border-collapse: collapse; background: #FDFAF4; border: 1px solid #D9C9A8;">
          <tbody>
            <tr>
              <td style="padding: 10px 12px; border-bottom: 1px solid #EDE5D0; color: #8C6E5A;">Company</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #EDE5D0;">${company}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; border-bottom: 1px solid #EDE5D0; color: #8C6E5A;">Name</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #EDE5D0;">${firstName} ${lastName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; color: #8C6E5A;">Business Email</td>
              <td style="padding: 10px 12px;">${email}</td>
            </tr>
          </tbody>
        </table>
        <p style="font-size: 0.8rem; color: #8C6E5A; margin-top: 1.5rem;">
          Reply to this partner and issue them an access code if approved.
        </p>
      </div>
      <div style="background: #3D2B1F; padding: 1rem; text-align: center;">
        <p style="color: #EDE5D0; font-size: 0.7rem; opacity: 0.6; margin: 0;">
          Parmigiano Reggiano Trade Shop
        </p>
      </div>
    </div>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'New Access Request <orders@pontepr.com>',
        to: 'federico@pontepr.com',
        reply_to: email.trim(),
        subject: `New Access Request — ${company}`,
        html: requestHtml,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Request access error:', err)
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
  }
}
