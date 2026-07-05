import { NextRequest, NextResponse } from 'next/server'
import { products } from '@/lib/products'
import { getPartners } from '@/lib/partners'
import { addOrder } from '@/lib/orders'

const KV_URL = process.env.KV_REST_API_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN

async function kvGet(key: string): Promise<number | null> {
  const res = await fetch(`${KV_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: 'no-store',
  })
  const data = await res.json()
  return data.result !== null ? parseInt(data.result) : null
}

async function kvSet(key: string, value: number) {
  await fetch(`${KV_URL}/set/${key}/${value}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  })
}

export async function POST(req: NextRequest) {
  const { partnerName, items } = await req.json()

  if (!partnerName || !items || items.length === 0) {
    return NextResponse.json({ error: 'Invalid order' }, { status: 400 })
  }

  try {
    await addOrder({ partnerName, items })
  } catch (err) {
    console.error('Failed to persist order:', err)
  }

  // Decrease inventory in KV
  for (const item of items) {
    const product = products.find(p => p.code === item.code)
    if (!product) continue

    const key = `inv:${product.sku}`
    let currentQty = await kvGet(key)

    // If not in KV yet, use default from products.ts
    if (currentQty === null) currentQty = product.qty

    const newQty = Math.max(0, currentQty - item.qty)
    await kvSet(key, newQty)
  }

  // Send email via Resend
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
  }

  const partners = await getPartners()
  const partner = partners.find(p => p.name === partnerName)
  const shippingAddress = partner?.shippingAddress?.trim()

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
        <p style="font-size: 0.85rem; color: #6B4C38; margin-bottom: 1.5rem;">
          <strong>Shipping address:</strong> ${shippingAddress || 'Not on file — check with the partner before shipping.'}
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
  } catch (err) {
    console.error('Email error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  // Send a recap to the partner too, so they can catch mistakes — best-effort,
  // doesn't fail the order if it errors or if no contact email is on file.
  if (partner?.contactEmail) {
    const recapHtml = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #2C1F14;">
        <div style="background: #3D2B1F; padding: 2rem; text-align: center; border-bottom: 2px solid #B8963E;">
          <h1 style="color: #D4AF5A; font-size: 1.4rem; font-weight: 400; letter-spacing: 0.15em; text-transform: uppercase; margin: 0;">
            Parmigiano Reggiano
          </h1>
          <p style="color: #EDE5D0; font-size: 0.8rem; margin: 0.5rem 0 0; letter-spacing: 0.1em;">Order Recap</p>
        </div>
        <div style="padding: 2rem; background: #F7F2E8;">
          <p style="font-size: 0.9rem; color: #6B4C38; margin-bottom: 1.5rem;">
            Thank you, ${partnerName}. Here&rsquo;s a recap of the order you just submitted.
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
          <p style="font-size: 0.85rem; color: #6B4C38; margin-top: 1.5rem;">
            This is an estimate only — your final total will reflect shipping and packing costs, confirmed before invoicing.
          </p>
          <p style="font-size: 0.85rem; color: #6B4C38; margin-top: 1rem;">
            Spot a mistake or want to add something? Just reply to this email and we&rsquo;ll take care of it before your order is processed.
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
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'orders@pontepr.com',
          to: partner.contactEmail,
          reply_to: 'federico@pontepr.com',
          subject: `Your Order Recap — Parmigiano Reggiano Trade Shop`,
          html: recapHtml,
        }),
      })
    } catch (err) {
      console.error('Partner recap email error:', err)
    }
  }

  return NextResponse.json({ success: true })
}
