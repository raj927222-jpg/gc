import { INITIAL_PRODUCTS, LUXURY_COLORS } from '../src/data/products';

export const DEFAULT_SHIPPING_CONFIG = {
  shippingChargesEnabled: true,
  standardShippingFee: 450,
  freeShippingThreshold: 15000,
  shippingLabel: 'Express White-Glove Shipping',
};

export const DEFAULT_ATELIER_INFO = {
  storeName: 'Gyutaro Atelier & Collection',
  tagline: 'The Pinnacle of Indian Luxury & Haute Couture',
  brandLocation: 'Surat, Gujarat, India',
  supportEmail: 'atelier@gyutarocollection.com',
  conciergePhone: '+91 (0) 261 400 8900',
  currency: 'INR',
  currencySymbol: '₹',
};

export const DEFAULT_BRANDING_ASSETS = {
  heroBgImage: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=2000&auto=format&fit=crop',
  aboutImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
};

export const DEFAULT_ORDERS = [
  {
    id: 'ord-1001',
    orderNumber: 'GC-2026-8421',
    date: 'Oct 06, 2026',
    customer: {
      firstName: 'Rajvardhan',
      lastName: 'Singhania',
      email: 'raj.singhania@luxuryindia.com',
      phone: '+91 98201 44521',
      address: '42 Altamount Road, Cumballa Hill',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400026',
    },
    items: [
      {
        product: INITIAL_PRODUCTS[5] || INITIAL_PRODUCTS[0], // GC COMBO
        selectedColor: LUXURY_COLORS.obsidian,
        selectedSize: 'Custom Bespoke Suite',
        quantity: 1,
        addedAt: Date.now() - 86400000 * 2,
      },
      {
        product: INITIAL_PRODUCTS[1], // GC WATCH
        selectedColor: LUXURY_COLORS.champagne,
        selectedSize: '44mm Grand',
        quantity: 1,
        addedAt: Date.now() - 86400000 * 2,
      },
    ],
    subtotal: 97500,
    discount: 0,
    shipping: 0,
    total: 97500,
    paymentMethod: 'UPI',
    status: 'DELIVERED',
    trackingNumber: 'BD-LUXE-892144',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'ord-1002',
    orderNumber: 'GC-2026-6734',
    date: 'Oct 07, 2026',
    customer: {
      firstName: 'Aarav',
      lastName: 'Mehra',
      email: 'aarav.mehra@delhiclub.in',
      phone: '+91 98110 33890',
      address: '18 Amrita Shergill Marg, Golf Links',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110003',
    },
    items: [
      {
        product: INITIAL_PRODUCTS[4], // GC JACKET
        selectedColor: LUXURY_COLORS.crimson,
        selectedSize: '42R',
        quantity: 1,
        addedAt: Date.now() - 86400000,
      },
      {
        product: INITIAL_PRODUCTS[0], // GC SHIRT
        selectedColor: LUXURY_COLORS.ivory,
        selectedSize: '42 (L)',
        quantity: 1,
        addedAt: Date.now() - 86400000,
      },
    ],
    subtotal: 35400,
    discount: 0,
    shipping: 0,
    total: 35400,
    paymentMethod: 'CARD',
    status: 'SHIPPED',
    trackingNumber: 'BD-LUXE-441209',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'ord-1003',
    orderNumber: 'GC-2026-5129',
    date: 'Oct 07, 2026',
    customer: {
      firstName: 'Vikramaditya',
      lastName: 'Birla',
      email: 'vikram.birla@birlagroup.co',
      phone: '+91 99300 77112',
      address: '7 Nariman Point, Marine Drive',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400021',
    },
    items: [
      {
        product: INITIAL_PRODUCTS[1], // GC WATCH
        selectedColor: LUXURY_COLORS.champagne,
        selectedSize: '41mm Case',
        quantity: 1,
        addedAt: Date.now() - 43200000,
      },
      {
        product: INITIAL_PRODUCTS[6], // GC SHOES
        selectedColor: LUXURY_COLORS.obsidian,
        selectedSize: 'UK 9',
        quantity: 1,
        addedAt: Date.now() - 43200000,
      },
    ],
    subtotal: 66500,
    discount: 0,
    shipping: 0,
    total: 66500,
    paymentMethod: 'NET_BANKING',
    status: 'PROCESSING',
    trackingNumber: 'BD-LUXE-903211',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 'ord-1004',
    orderNumber: 'GC-2026-3840',
    date: 'Oct 08, 2026',
    customer: {
      firstName: 'Kabir',
      lastName: 'Malhotra',
      email: 'kabir.m@surattextiles.com',
      phone: '+91 97250 88234',
      address: 'Bungalow 12, Ghod Dod Road',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '395007',
    },
    items: [
      {
        product: INITIAL_PRODUCTS[0], // GC SHIRT
        selectedColor: LUXURY_COLORS.obsidian,
        selectedSize: '40 (M)',
        quantity: 2,
        addedAt: Date.now() - 21600000,
      },
      {
        product: INITIAL_PRODUCTS[2], // GC PANT
        selectedColor: LUXURY_COLORS.obsidian,
        selectedSize: '32 (M)',
        quantity: 1,
        addedAt: Date.now() - 21600000,
      },
    ],
    subtotal: 29200,
    discount: 0,
    shipping: 0,
    total: 29200,
    paymentMethod: 'UPI',
    status: 'CONFIRMED',
    trackingNumber: 'BD-LUXE-112398',
    createdAt: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    id: 'ord-1005',
    orderNumber: 'GC-2026-2195',
    date: 'Oct 08, 2026',
    customer: {
      firstName: 'Devendra',
      lastName: 'Oberoi',
      email: 'dev.oberoi@palacehotels.com',
      phone: '+91 98290 66450',
      address: '5 Civil Lines, Raj Bhavan Road',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302006',
    },
    items: [
      {
        product: INITIAL_PRODUCTS[7] || INITIAL_PRODUCTS[0], // GC GOGGLES
        selectedColor: LUXURY_COLORS.champagne,
        selectedSize: '54-18-145 (Universal Fit)',
        quantity: 1,
        addedAt: Date.now() - 7200000,
      },
    ],
    subtotal: 12800,
    discount: 0,
    shipping: 450,
    total: 13250,
    paymentMethod: 'CARD',
    status: 'PENDING',
    trackingNumber: 'BD-LUXE-559021',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];
