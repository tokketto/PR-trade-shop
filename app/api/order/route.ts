import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { partnerName, items } = await req.json()

  if (!partnerName || !items || items.length === 0) {
    return NextResponse.json({ error: 'Invalid order' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
  }

  // Build order table rows
  const itemRows = items.map((item: { name: string; code: string; qty: number }) => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #EDE5D0;">${item.name}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #EDE5D0; color: #8C6E5A;">${item.code}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #EDE5D0; text-align: center;">${item.qty}</td>
    </tr>
  `).join('')

  const orderHtml = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #2C1F14;">
      <div style="background: #3D2B1F; padding: 2rem; text-align: center; border-bottom: 2px solid #B8963E;">
        <h1 style="color: #D4AF5A; font-size: 1.4rem; font-weight: 400; letter-spacing: 0.15em; text-transform: uppercase; margin: 0;">
          Parmigiano Reggiano
        </h1>
        <p style="color: #EDE5D0; font-size: 0.8rem; margin: 0.5rem 0 0; letter-spacing: 0.1em;">New Trade Order</p>
      </div>
      <div style="padding: 2rem; background: #F7F2E8;">
        <p style="font-size: 0.9rem; color: #6B4C38; margin-bottom: 1.5rem;">
          A new order has been submitted by <strong>${partnerName}</strong>.
        </p>
        <table style="width: 100%; border-collapse: collapse; background: #FDFAF4; border: 1px solid #D9C9A8;">
          <thead>
            <tr style="background: #3D2B1F;">
              <th style="padding: 10px 12px; color: #D4AF5A; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; text-align: left; font-weight: 400;">Product</th>
              <th style="padding: 10px 12px; color: #D4AF5A; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; text-align: left; font-weight: 400;">Code</th>
              <th style="padding: 10px 12px; color: #D4AF5A; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; text-align: center; font-weight: 400;">Qty</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <p style="font-size: 0.8rem; color: #8C6E5A; margin-top: 1.5rem;">
          Please review and send a Stripe invoice to the partner.
        </p>
      </div>
      <div style="background: #3D2B1F; padding: 1rem; text-align: center;">
        <p style="color: #EDE5D0; font-size: 0.7rem; opacity: 0.6; margin: 0;">
          Parmigiano Reggiano Trade Shop — shop.pontecollab.com
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
        from: 'orders@pontepr.com',
        to: 'federico@pontepr.com',
        subject: `New Trade Order — ${partnerName}`,
        html: orderHtml,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Email error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
