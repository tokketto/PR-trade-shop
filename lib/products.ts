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
  { name: 'Apron (Polyester)', code: 'PR2504', sku: 'Adv_PR2504', qty: 122, category: 'apparel', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186134/Apron_zxnefd.jpg' },
  { name: 'Baseball Cap', code: 'PR2515', sku: 'Adv_PR2515', qty: 167, category: 'apparel', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186258/Baseball-cap_iepdwm.jpg' },
  { name: 'T-Shirt Small', code: 'PR2509', sku: 'Adv_PR2509', qty: 55, category: 'apparel', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186357/T-shirt_csnmgj.jpg' },
  { name: 'T-Shirt Medium', code: 'PR2510', sku: 'Adv_PR2510', qty: 54, category: 'apparel', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186357/T-shirt_csnmgj.jpg' },
  { name: 'T-Shirt Large', code: 'PR2511', sku: 'Adv_PR2511', qty: 54, category: 'apparel', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186357/T-shirt_csnmgj.jpg' },
  { name: 'T-Shirt Extra Large', code: 'PR2512', sku: 'Adv_PR2512', qty: 53, category: 'apparel', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186357/T-shirt_csnmgj.jpg' },
  // KNIVES
  { name: 'Knife — Flat Tip Professional', code: 'PR2604', sku: 'Adv_PR2604', qty: 85, category: 'knives', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186376/ProfessionalKife-flatTip_zd6nfn.jpg' },
  { name: 'Knife — Small Almond Consumer', code: 'PR2605', sku: 'Adv_PR2605', qty: 38, category: 'knives', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186388/ProfessionalKnife-almond_eyga3f.jpg' },
  { name: 'Knife — Almond Professional', code: 'PR2602', sku: 'Adv_PR2602', qty: 41, category: 'knives', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186388/ProfessionalKnife-almond_eyga3f.jpg' },
  { name: 'Knife — Double Hook Professional', code: 'PR2601', sku: 'Adv_PR2601', qty: 85, category: 'knives', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186376/ProfesisonalKnife-doublehook_fperhu.jpg' },
  { name: 'Knife — Double Serrated Professional', code: 'PR2603', sku: 'Adv_PR2603', qty: 74, category: 'knives', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186405/ProfessionKnife-stilleto_anab48.jpg' },
  // DISPLAY
  { name: 'Display 9" × 13 7/16"', code: 'PR2507', sku: 'Adv_PR2507', qty: 2456, category: 'display', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186284/Display_xinvyt.jpg' },
  { name: 'Plastic Cheese Wheel', code: 'PR2508', sku: 'Adv_PR2508', qty: 30, category: 'display', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186278/Plastic-Wheel_wlsw2k.jpg' },
  { name: 'Plastic Cheese Wheel with Bowl', code: 'PR2508b', sku: 'Adv_PR2508b', qty: 28, category: 'display', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186297/Plastic-wheel-with-bowl_dezq3j.jpg' },
  { name: 'Cheese Wheel Holders', code: 'PR2502', sku: 'Adv_PR2502', qty: 5, category: 'display', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186399/Wheel-stand_ka8qys.jpg' },
  { name: 'Zocca — Battitore Inspection Stand', code: 'PR-ZOCCA', sku: 'Adv_ZOCCA', qty: 10, category: 'display', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186379/Zocca_zubuna.jpg', price: '$900 (incl. shipping)' },
  // ACCESSORIES
  { name: 'Cutting Board 18 × 7"', code: 'PR2501', sku: 'Adv_PR2501', qty: 3, category: 'accessories', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186304/Cutting-board_c6f802.jpg' },
  { name: 'Table Runner 36" × 90"', code: 'PR2606', sku: 'Adv_PR2606', qty: 16, category: 'accessories', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186334/Runner_natssm.jpg' },
  { name: 'Napkins (Pack of 50)', code: 'PR2506a', sku: 'Adv_PR2506a', qty: 46, category: 'accessories', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186403/Napkins_qwt2aj.jpg' },
  { name: 'Toothpicks (100 per bag)', code: 'PR2505', sku: 'Adv_PR2505', qty: 75, category: 'accessories', img: 'https://res.cloudinary.com/w1ti71ox/image/upload/v1783186375/Toothpicks_opsxv2.jpg' },
]

export const categoryLabels: Record<string, string> = {
  apparel: 'Branded Apparel',
  knives: 'Professional Knives',
  display: 'Display & Props',
  accessories: 'Table Accessories',
}
