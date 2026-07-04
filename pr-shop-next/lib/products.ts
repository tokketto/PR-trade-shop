export type Product = {
  name: string
  code: string
  sku: string
  qty: number
  category: 'apparel' | 'knives' | 'display' | 'accessories'
  img: string
  price?: string
}

export const products: Product[] = [
  // APPAREL
  { name: 'Apron (Polyester)', code: 'PR2504', sku: 'Adv_PR2504', qty: 122, category: 'apparel', img: 'Apron.jpg' },
  { name: 'Baseball Cap', code: 'PR2515', sku: 'Adv_PR2515', qty: 167, category: 'apparel', img: 'Baseball-cap.png' },
  { name: 'T-Shirt Small', code: 'PR2509', sku: 'Adv_PR2509', qty: 55, category: 'apparel', img: 'T-shirt.png' },
  { name: 'T-Shirt Medium', code: 'PR2510', sku: 'Adv_PR2510', qty: 54, category: 'apparel', img: 'T-shirt.png' },
  { name: 'T-Shirt Large', code: 'PR2511', sku: 'Adv_PR2511', qty: 54, category: 'apparel', img: 'T-shirt.png' },
  { name: 'T-Shirt Extra Large', code: 'PR2512', sku: 'Adv_PR2512', qty: 53, category: 'apparel', img: 'T-shirt.png' },
  // KNIVES
  { name: 'Knife — Flat Tip Professional', code: 'PR2604', sku: 'Adv_PR2604', qty: 85, category: 'knives', img: 'ProfessionalKife-flatTip.png' },
  { name: 'Knife — Small Almond Consumer', code: 'PR2605', sku: 'Adv_PR2605', qty: 38, category: 'knives', img: 'ProfessionalKnife-almond.png' },
  { name: 'Knife — Almond Professional', code: 'PR2602', sku: 'Adv_PR2602', qty: 41, category: 'knives', img: 'ProfessionalKnife-almond.png' },
  { name: 'Knife — Double Hook Professional', code: 'PR2601', sku: 'Adv_PR2601', qty: 85, category: 'knives', img: 'ProfesisonalKnife-doublehook.png' },
  { name: 'Knife — Double Serrated Professional', code: 'PR2603', sku: 'Adv_PR2603', qty: 74, category: 'knives', img: 'ProfessionKnife-stilleto.png' },
  // DISPLAY
  { name: 'Display 9" × 13 7/16"', code: 'PR2507', sku: 'Adv_PR2507', qty: 2456, category: 'display', img: 'Display.png' },
  { name: 'Plastic Cheese Wheel', code: 'PR2508', sku: 'Adv_PR2508', qty: 30, category: 'display', img: 'Plastic-Wheel.png' },
  { name: 'Plastic Cheese Wheel with Bowl', code: 'PR2508b', sku: 'Adv_PR2508b', qty: 28, category: 'display', img: 'Plastic-wheel-with-bowl.png' },
  { name: 'Cheese Wheel Holders', code: 'PR2502', sku: 'Adv_PR2502', qty: 5, category: 'display', img: 'Wheel-stand.png' },
  { name: 'Zocca — Battitore Inspection Stand', code: 'PR-ZOCCA', sku: 'Adv_ZOCCA', qty: 10, category: 'display', img: 'Zocca.jpg', price: '$900 (incl. shipping)' },
  // ACCESSORIES
  { name: 'Cutting Board 18 × 7"', code: 'PR2501', sku: 'Adv_PR2501', qty: 3, category: 'accessories', img: 'Cutting-board.png' },
  { name: 'Table Runner 36" × 90"', code: 'PR2606', sku: 'Adv_PR2606', qty: 16, category: 'accessories', img: 'Runner.jpg' },
  { name: 'Napkins (Pack of 50)', code: 'PR2506a', sku: 'Adv_PR2506a', qty: 46, category: 'accessories', img: 'Napkins.png' },
  { name: 'Toothpicks (100 per bag)', code: 'PR2505', sku: 'Adv_PR2505', qty: 75, category: 'accessories', img: 'Toothpicks.png' },
]

export const categoryLabels: Record<string, string> = {
  apparel: 'Branded Apparel',
  knives: 'Professional Knives',
  display: 'Display & Props',
  accessories: 'Table Accessories',
}
