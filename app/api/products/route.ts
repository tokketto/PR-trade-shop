import { NextRequest, NextResponse } from 'next/server'
import { getProducts, saveProducts, type Product } from '@/lib/catalog'
import { isAdminRequest } from '@/lib/session'

export async function GET() {
  const products = await getProducts()
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, code, sku, category, price, img, priceNote, description, qty, variantGroup, variantLabel } = await req.json()

  if (!name?.trim() || !code?.trim() || !sku?.trim() || !category || price === undefined || !img?.trim()) {
    return NextResponse.json({ error: 'Name, code, SKU, category, price, and image are required' }, { status: 400 })
  }

  try {
    const products = await getProducts()
    if (products.some(p => p.sku === sku.trim())) {
      return NextResponse.json({ error: 'That SKU is already in use' }, { status: 409 })
    }
    if (products.some(p => p.code === code.trim())) {
      return NextResponse.json({ error: 'That product code is already in use' }, { status: 409 })
    }

    const newProduct: Product = {
      name: name.trim(),
      code: code.trim(),
      sku: sku.trim(),
      qty: qty !== undefined ? Math.max(0, Number(qty)) : 0,
      category,
      img: img.trim(),
      price: Number(price),
      ...(priceNote?.trim() ? { priceNote: priceNote.trim() } : {}),
      ...(description?.trim() ? { description: description.trim() } : {}),
      ...(variantGroup?.trim() ? { variantGroup: variantGroup.trim() } : {}),
      ...(variantLabel?.trim() ? { variantLabel: variantLabel.trim() } : {}),
    }

    const updated = [...products, newProduct]
    await saveProducts(updated)
    return NextResponse.json(updated)
  } catch (err) {
    console.error('Add product error:', err)
    return NextResponse.json({ error: 'Could not save — database unavailable' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sku, name, code, category, price, img, priceNote, description, qty, variantGroup, variantLabel } = await req.json()

  if (!sku) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  try {
    const products = await getProducts()
    const target = products.find(p => p.sku === sku)
    if (!target) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'Product name cannot be empty' }, { status: 400 })
    }
    if (code !== undefined && code.trim() && code.trim() !== target.code && products.some(p => p.code === code.trim())) {
      return NextResponse.json({ error: 'That product code is already in use' }, { status: 409 })
    }

    const updated = products.map(p => p.sku === sku
      ? {
          ...p,
          ...(name?.trim() ? { name: name.trim() } : {}),
          ...(code?.trim() ? { code: code.trim() } : {}),
          ...(category ? { category } : {}),
          ...(price !== undefined ? { price: Number(price) } : {}),
          ...(img?.trim() ? { img: img.trim() } : {}),
          ...(priceNote !== undefined ? { priceNote: priceNote.trim() || undefined } : {}),
          ...(description !== undefined ? { description: description.trim() || undefined } : {}),
          ...(qty !== undefined ? { qty: Math.max(0, Number(qty)) } : {}),
          ...(variantGroup !== undefined ? { variantGroup: variantGroup.trim() || undefined } : {}),
          ...(variantLabel !== undefined ? { variantLabel: variantLabel.trim() || undefined } : {}),
        }
      : p)
    await saveProducts(updated)
    return NextResponse.json(updated)
  } catch (err) {
    console.error('Update product error:', err)
    return NextResponse.json({ error: 'Could not save — database unavailable' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sku } = await req.json()

  if (!sku) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  try {
    const products = await getProducts()
    if (!products.some(p => p.sku === sku)) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const updated = products.filter(p => p.sku !== sku)
    await saveProducts(updated)
    return NextResponse.json(updated)
  } catch (err) {
    console.error('Delete product error:', err)
    return NextResponse.json({ error: 'Could not save — database unavailable' }, { status: 500 })
  }
}
