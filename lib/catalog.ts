import { kvGetString, kvSetString } from './kv'

export type Product = {
  name: string
  code: string
  sku: string
  qty: number
  category: 'apparel' | 'knives' | 'display' | 'accessories'
  img: string
  price: number
  priceNote?: string
  description?: string
  // Products sharing the same variantGroup render as one card in the shop,
  // with a size/option picker built from each variant's variantLabel.
  variantGroup?: string
  variantLabel?: string
}

export const categoryLabels: Record<string, string> = {
  apparel: 'Branded Apparel',
  knives: 'Professional Knives',
  display: 'Display & Props',
  accessories: 'Table Accessories',
}

const PRODUCTS_KEY = 'products'

// One-time seed data — only used the first time the KV store is read.
// After that, /admin/products is the source of truth.
const SEED_PRODUCTS: Product[] = [
  // APPAREL
  { name: 'Apron (Polyester)', code: 'PR2504', sku: 'Adv_PR2504', qty: 122, category: 'apparel', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186134/Apron_zxnefd.jpg', price: 18 },
  { name: 'Baseball Cap', code: 'PR2515', sku: 'Adv_PR2515', qty: 167, category: 'apparel', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186258/Baseball-cap_iepdwm.jpg', price: 14 },
  { name: 'T-Shirt', code: 'PR2509', sku: 'Adv_PR2509', qty: 55, category: 'apparel', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186357/T-shirt_csnmgj.jpg', price: 16, variantGroup: 'tshirt', variantLabel: 'Small' },
  { name: 'T-Shirt', code: 'PR2510', sku: 'Adv_PR2510', qty: 54, category: 'apparel', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186357/T-shirt_csnmgj.jpg', price: 16, variantGroup: 'tshirt', variantLabel: 'Medium' },
  { name: 'T-Shirt', code: 'PR2511', sku: 'Adv_PR2511', qty: 54, category: 'apparel', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186357/T-shirt_csnmgj.jpg', price: 16, variantGroup: 'tshirt', variantLabel: 'Large' },
  { name: 'T-Shirt', code: 'PR2512', sku: 'Adv_PR2512', qty: 53, category: 'apparel', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186357/T-shirt_csnmgj.jpg', price: 18, variantGroup: 'tshirt', variantLabel: 'Extra Large' },
  // KNIVES
  { name: 'Knife — Flat Tip Professional', code: 'PR2604', sku: 'Adv_PR2604', qty: 85, category: 'knives', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186376/ProfessionalKife-flatTip_zd6nfn.jpg', price: 32 },
  { name: 'Knife — Small Almond Consumer', code: 'PR2605', sku: 'Adv_PR2605', qty: 38, category: 'knives', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186388/ProfessionalKnife-almond_eyga3f.jpg', price: 22 },
  { name: 'Knife — Almond Professional', code: 'PR2602', sku: 'Adv_PR2602', qty: 41, category: 'knives', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186388/ProfessionalKnife-almond_eyga3f.jpg', price: 34 },
  { name: 'Knife — Double Hook Professional', code: 'PR2601', sku: 'Adv_PR2601', qty: 85, category: 'knives', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186376/ProfesisonalKnife-doublehook_fperhu.jpg', price: 36 },
  { name: 'Knife — Double Serrated Professional', code: 'PR2603', sku: 'Adv_PR2603', qty: 74, category: 'knives', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186405/ProfessionKnife-stilleto_anab48.jpg', price: 38 },
  // DISPLAY
  { name: 'Display 9" × 13 7/16"', code: 'PR2507', sku: 'Adv_PR2507', qty: 2456, category: 'display', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186284/Display_xinvyt.jpg', price: 0 },
  { name: 'Plastic Cheese Wheel', code: 'PR2508', sku: 'Adv_PR2508', qty: 30, category: 'display', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186278/Plastic-Wheel_wlsw2k.jpg', price: 60 },
  { name: 'Plastic Cheese Wheel with Bowl', code: 'PR2508b', sku: 'Adv_PR2508b', qty: 28, category: 'display', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186297/Plastic-wheel-with-bowl_dezq3j.jpg', price: 75 },
  { name: 'Cheese Wheel Holders', code: 'PR2502', sku: 'Adv_PR2502', qty: 5, category: 'display', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186399/Wheel-stand_ka8qys.jpg', price: 120 },
  { name: 'Zocca — Battitore Inspection Stand', code: 'PR-ZOCCA', sku: 'Adv_ZOCCA', qty: 10, category: 'display', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186379/Zocca_zubuna.jpg', price: 900, priceNote: 'incl. shipping' },
  // ACCESSORIES
  { name: 'Cutting Board 18 × 7"', code: 'PR2501', sku: 'Adv_PR2501', qty: 3, category: 'accessories', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186304/Cutting-board_c6f802.jpg', price: 55 },
  { name: 'Table Runner 36" × 90"', code: 'PR2606', sku: 'Adv_PR2606', qty: 16, category: 'accessories', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186334/Runner_natssm.jpg', price: 28 },
  { name: 'Napkins (Pack of 50)', code: 'PR2506a', sku: 'Adv_PR2506a', qty: 46, category: 'accessories', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186403/Napkins_qwt2aj.jpg', price: 9 },
  { name: 'Toothpicks (100 per bag)', code: 'PR2505', sku: 'Adv_PR2505', qty: 75, category: 'accessories', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186375/Toothpicks_opsxv2.jpg', price: 5 },
]

// On migration, carry over any live quantity already tracked under the old
// inv:<sku> keys instead of resetting to the static seed default.
async function seedFromStatic(): Promise<Product[]> {
  const seeded = await Promise.all(SEED_PRODUCTS.map(async (p) => {
    const liveQty = await kvGetString(`inv:${p.sku}`)
    return liveQty !== null ? { ...p, qty: parseInt(liveQty) || 0 } : p
  }))
  await saveProducts(seeded)
  return seeded
}

export async function getProducts(): Promise<Product[]> {
  try {
    const raw = await kvGetString(PRODUCTS_KEY)
    if (raw) {
      try { return JSON.parse(raw) } catch { /* fall through and reseed */ }
    }
    return await seedFromStatic()
  } catch (err) {
    console.error('Products KV error, falling back to static seed:', err)
    return SEED_PRODUCTS
  }
}

export async function saveProducts(products: Product[]): Promise<void> {
  await kvSetString(PRODUCTS_KEY, JSON.stringify(products))
}
